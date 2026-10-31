// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CopyrightMarket is Ownable2Step, ReentrancyGuard {
    string public constant TERMS_VERSION = "CopyrightLicenseTerms/v1";
    uint256 public constant MIN_PRICE = 1 wei;
    uint256 public constant MAX_PRICE = 1 ether;
    uint64 public constant MIN_DURATION = 60;
    uint64 public constant MAX_DURATION = 365 days;
    uint64 public constant MIN_ACCEPT_WINDOW = 60;
    uint64 public constant MAX_ACCEPT_WINDOW = 30 days;

    enum WorkStatus { None, Active, Invalidated }
    enum OfferStoredState { None, Open, Accepted, Closed }
    enum OfferCloseReason { None, SellerCancelled, DeadlineExpired, WorkInvalidated }
    enum OfferStatus { None, Open, Accepted, Cancelled, Expired, Invalidated }
    enum SettlementReason { None, NormalExpiry, AuthorRevoked, WorkInvalidated }
    enum LicenseStatus { None, Active, AuthorRevoked, WorkInvalidated, Expired }
    enum CaseStatus { None, Pending, Resolved }
    enum CaseOutcome { None, Uphold, Invalidate }
    enum CreditSource { OfferDeposit, LicensePrice, LicenseSettlement, CaseReward }

    struct Work { uint256 id; bytes32 fileHash; address registrant; string title; string description; uint8 category; string referenceUrl; uint64 registeredAt; uint64 invalidatedAt; uint256 invalidatedByCaseId; uint256 previousWorkId; uint256 acceptedCount; }
    struct Offer { uint256 id; uint256 workId; address seller; uint256 price; uint256 compensation; uint64 duration; uint64 acceptUntil; uint64 createdAt; string scope; bytes32 termsHash; OfferStoredState state; OfferCloseReason closeReason; uint256 licenseId; }
    struct License { uint256 id; uint256 offerId; uint256 workId; address seller; address licensee; uint64 startsAt; uint64 endsAt; uint64 authorRevokedAt; bool settled; SettlementReason settlementReason; uint64 settledAt; }
    struct CaseRecord { uint256 id; uint256 workId; string externalRef; bytes32 evidenceHash; address openedBy; uint64 openedAt; CaseStatus status; CaseOutcome outcome; bytes32 decisionHash; string decisionSummary; address resolvedBy; uint64 resolvedAt; uint256 rewardAmount; bool rewardCredited; }

    error NotFound(); error ZeroHash(); error EmptyField(); error FieldTooLong(); error InvalidCategory(); error InvalidReferenceUrl(); error DuplicateActiveWork(); error NotRegistrant(); error WorkInvalidatedError(); error InvalidAmount(); error InvalidDuration(); error InvalidAcceptUntil(); error OfferNotOpen(); error OfferNotRefundable(); error SelfPurchase(); error TermsMismatch(); error LicenseNotActive(); error LicenseNotSettleable(); error AlreadySettled(); error ZeroRecipient(); error ZeroBalance(); error TransferFailed(); error InvalidPage(); error InvalidCaseRef(); error DuplicateCaseRef(); error PendingCaseExists(); error CaseNotPending(); error InvalidOutcome(); error RewardAlreadyCredited(); error InsufficientRewardPool(); error NotPayableAmount();

    uint256 public nextWorkId = 1; uint256 public nextOfferId = 1; uint256 public nextLicenseId = 1; uint256 public nextCaseId = 1;
    uint256 public totalLockedDeposits; uint256 public totalClaimable; uint256 public rewardPoolBalance; uint256 public pendingCaseRewards;
    uint256 public immutable gasSubsidy; uint256 public immutable reviewReward;

    mapping(address => uint256) public claimable;
    mapping(bytes32 => uint256) public activeWorkByHash; mapping(bytes32 => uint256) public latestWorkByHash;
    mapping(uint256 => Work) private works; mapping(uint256 => Offer) private offers; mapping(uint256 => License) private licenses; mapping(uint256 => CaseRecord) private cases;
    mapping(bytes32 => bool) private usedCaseRef; mapping(uint256 => uint256) public openCaseByWork;
    uint256[] private workIds; uint256[] private caseIds;
    mapping(address => uint256[]) private worksByRegistrant; mapping(bytes32 => uint256[]) private worksByHash;
    mapping(uint256 => uint256[]) private offersByWork; mapping(address => uint256[]) private offersBySeller;
    mapping(uint256 => uint256[]) private licensesByWork; mapping(address => uint256[]) private licensesByLicensee; mapping(bytes32 => uint256[]) private licensesByUserWork;
    mapping(uint256 => uint256[]) private casesByWork;

    event WorkRegistered(uint256 indexed workId, bytes32 indexed fileHash, address indexed registrant, uint256 previousWorkId, uint64 registeredAt);
    event WorkInvalidated(uint256 indexed workId, uint256 indexed caseId, address indexed executor, uint64 invalidatedAt);
    event OfferCreated(uint256 indexed offerId, uint256 indexed workId, address indexed seller, uint256 price, uint256 compensation, uint64 duration, uint64 acceptUntil, bytes32 termsHash);
    event OfferClosed(uint256 indexed offerId, address indexed seller, OfferCloseReason closeReason, uint256 returnedDeposit);
    event OfferAccepted(uint256 indexed offerId, uint256 indexed licenseId, uint256 indexed workId, address buyer, uint64 startsAt, uint64 endsAt);
    event LicenseRevoked(uint256 indexed licenseId, uint256 indexed workId, address indexed seller, uint64 revokedAt);
    event LicenseSettled(uint256 indexed licenseId, SettlementReason reason, address indexed buyer, address indexed seller, uint256 buyerCredit, uint256 sellerCredit, uint64 effectiveEndAt, uint64 settledAt);
    event BalanceCredited(address indexed account, uint256 amount, CreditSource source, uint256 sourceId);
    event Withdrawal(address indexed account, address indexed recipient, uint256 amount);
    event CaseOpened(uint256 indexed caseId, uint256 indexed workId, string externalRef, bytes32 evidenceHash, address indexed openedBy);
    event CaseResolved(uint256 indexed caseId, uint256 indexed workId, CaseOutcome outcome, bytes32 decisionHash, address indexed resolvedBy, uint256 rewardAmount);
    event RewardPoolFunded(address indexed funder, uint256 amount, uint256 newBalance);
    event CaseRewardCredited(uint256 indexed caseId, address indexed executor, uint256 amount);

    constructor(address initialOwner, uint256 gasSubsidy_, uint256 reviewReward_) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroRecipient();
        gasSubsidy = gasSubsidy_; reviewReward = reviewReward_;
    }

    function registerWork(bytes32 fileHash, string calldata title, string calldata description, uint8 category, string calldata referenceUrl) external returns (uint256 id) {
        if (fileHash == bytes32(0)) revert ZeroHash(); if (activeWorkByHash[fileHash] != 0) revert DuplicateActiveWork();
        _checkBytes(title,1,96); _checkBytes(description,0,512); _checkBytes(referenceUrl,0,256); if(bytes(referenceUrl).length!=0&&!_hasHttpScheme(referenceUrl)) revert InvalidReferenceUrl(); if(category<1||category>5) revert InvalidCategory();
        id=nextWorkId++; uint256 previous=latestWorkByHash[fileHash];
        works[id]=Work(id,fileHash,msg.sender,title,description,category,referenceUrl,uint64(block.timestamp),0,0,previous,0);
        workIds.push(id); worksByRegistrant[msg.sender].push(id); worksByHash[fileHash].push(id); activeWorkByHash[fileHash]=id; latestWorkByHash[fileHash]=id;
        emit WorkRegistered(id,fileHash,msg.sender,previous,uint64(block.timestamp));
    }

    function createOffer(uint256 workId,uint256 price,uint64 duration,uint256 compensation,uint64 acceptUntil,string calldata scope) external payable returns(uint256 id) {
        Work storage w=works[workId]; if(w.id==0) revert NotFound(); if(w.registrant!=msg.sender) revert NotRegistrant(); if(w.invalidatedAt!=0) revert WorkInvalidatedError();
        if(price<MIN_PRICE||price>MAX_PRICE||compensation<MIN_PRICE||compensation>MAX_PRICE||msg.value!=price+compensation) revert InvalidAmount();
        if(duration<MIN_DURATION||duration>MAX_DURATION) revert InvalidDuration(); if(acceptUntil<block.timestamp+MIN_ACCEPT_WINDOW||acceptUntil>block.timestamp+MAX_ACCEPT_WINDOW) revert InvalidAcceptUntil(); _checkBytes(scope,1,512);
        id=nextOfferId++; bytes32 terms=termsHash(id,workId,w.fileHash,msg.sender,price,duration,compensation,acceptUntil,scope);
        offers[id]=Offer(id,workId,msg.sender,price,compensation,duration,acceptUntil,uint64(block.timestamp),scope,terms,OfferStoredState.Open,OfferCloseReason.None,0);
        offersByWork[workId].push(id); offersBySeller[msg.sender].push(id); totalLockedDeposits+=msg.value; emit OfferCreated(id,workId,msg.sender,price,compensation,duration,acceptUntil,terms);
    }

    function cancelOffer(uint256 offerId) external { Offer storage o=offers[offerId]; if(o.id==0) revert NotFound(); if(o.seller!=msg.sender) revert NotRegistrant(); if(!_isOfferOpen(o)) revert OfferNotOpen();
        o.state=OfferStoredState.Closed;o.closeReason=OfferCloseReason.SellerCancelled; totalLockedDeposits-=o.price+o.compensation; _credit(o.seller,o.price+o.compensation,CreditSource.OfferDeposit,offerId); emit OfferClosed(offerId,o.seller,o.closeReason,o.price+o.compensation);
    }
    function refundUnavailableOffer(uint256 offerId) external { Offer storage o=offers[offerId]; if(o.id==0) revert NotFound(); if(o.state!=OfferStoredState.Open) revert OfferNotRefundable(); Work storage w=works[o.workId]; OfferCloseReason reason;
        if(w.invalidatedAt!=0 && w.invalidatedAt<o.acceptUntil) reason=OfferCloseReason.WorkInvalidated; else if(block.timestamp>=o.acceptUntil) reason=OfferCloseReason.DeadlineExpired; else revert OfferNotRefundable();
        o.state=OfferStoredState.Closed;o.closeReason=reason; totalLockedDeposits-=o.price+o.compensation; _credit(o.seller,o.price+o.compensation,CreditSource.OfferDeposit,offerId); emit OfferClosed(offerId,o.seller,reason,o.price+o.compensation);
    }

    function acceptOffer(uint256 offerId,bytes32 expectedTermsHash) external payable returns(uint256 id) { Offer storage o=offers[offerId]; if(o.id==0) revert NotFound(); if(!_isOfferOpen(o)||block.timestamp>=o.acceptUntil) revert OfferNotOpen(); Work storage w=works[o.workId]; if(w.invalidatedAt!=0) revert WorkInvalidatedError(); if(msg.sender==o.seller) revert SelfPurchase(); if(msg.value!=o.price) revert InvalidAmount(); if(expectedTermsHash!=o.termsHash) revert TermsMismatch();
        o.state=OfferStoredState.Accepted; id=nextLicenseId++; uint64 start=uint64(block.timestamp); uint64 end=start+o.duration; licenses[id]=License(id,offerId,o.workId,o.seller,msg.sender,start,end,0,false,SettlementReason.None,0); o.licenseId=id; licensesByWork[o.workId].push(id); licensesByLicensee[msg.sender].push(id); licensesByUserWork[_userWorkKey(msg.sender,o.workId)].push(id); w.acceptedCount++; _credit(o.seller,o.price,CreditSource.LicensePrice,offerId); emit OfferAccepted(offerId,id,o.workId,msg.sender,start,end);
    }

    function revokeLicense(uint256 licenseId) external { License storage l=licenses[licenseId]; if(l.id==0) revert NotFound(); if(l.seller!=msg.sender) revert NotRegistrant(); if(l.settled||block.timestamp<l.startsAt||block.timestamp>=l.endsAt) revert LicenseNotActive(); Work storage w=works[l.workId]; if(w.invalidatedAt!=0) revert WorkInvalidatedError(); Offer storage o=offers[l.offerId]; uint64 elapsed=uint64(block.timestamp)-l.startsAt; uint64 total=l.endsAt-l.startsAt; uint256 earned=(o.price*elapsed)/total; uint256 buyer=o.price-earned+o.compensation; uint256 seller=earned; l.authorRevokedAt=uint64(block.timestamp); l.settled=true; l.settlementReason=SettlementReason.AuthorRevoked; l.settledAt=uint64(block.timestamp); totalLockedDeposits-=o.price+o.compensation; _credit(l.licensee,buyer,CreditSource.LicenseSettlement,licenseId); _credit(l.seller,seller,CreditSource.LicenseSettlement,licenseId); emit LicenseRevoked(licenseId,l.workId,l.seller,uint64(block.timestamp)); emit LicenseSettled(licenseId,SettlementReason.AuthorRevoked,l.licensee,l.seller,buyer,seller,uint64(block.timestamp),uint64(block.timestamp));
    }

    function settleLicense(uint256 licenseId) external { License storage l=licenses[licenseId]; if(l.id==0) revert NotFound(); if(l.settled) revert AlreadySettled(); Work storage w=works[l.workId]; SettlementReason reason; if(w.invalidatedAt!=0 && w.invalidatedAt<l.endsAt) reason=SettlementReason.WorkInvalidated; else if(block.timestamp>=l.endsAt) reason=SettlementReason.NormalExpiry; else revert LicenseNotSettleable(); Offer storage o=offers[l.offerId]; l.settled=true;l.settlementReason=reason;l.settledAt=uint64(block.timestamp); totalLockedDeposits-=o.price+o.compensation; uint256 buyer=reason==SettlementReason.WorkInvalidated?o.price+o.compensation:0; uint256 seller=reason==SettlementReason.NormalExpiry?o.price+o.compensation:0; if(buyer>0)_credit(l.licensee,buyer,CreditSource.LicenseSettlement,licenseId); if(seller>0)_credit(l.seller,seller,CreditSource.LicenseSettlement,licenseId); emit LicenseSettled(licenseId,reason,l.licensee,l.seller,buyer,seller,reason==SettlementReason.NormalExpiry?l.endsAt:w.invalidatedAt,uint64(block.timestamp));
    }

    function withdraw(address payable recipient) external nonReentrant { if(recipient==address(0)) revert ZeroRecipient(); uint256 amount=claimable[msg.sender]; if(amount==0) revert ZeroBalance(); claimable[msg.sender]=0;totalClaimable-=amount; (bool ok,)=recipient.call{value:amount}(""); if(!ok) revert TransferFailed(); emit Withdrawal(msg.sender,recipient,amount); }

    function openCase(uint256 workId,string calldata externalRef,bytes32 evidenceHash) external onlyOwner returns(uint256 id) { Work storage w=works[workId]; if(w.id==0) revert NotFound(); if(w.invalidatedAt!=0) revert WorkInvalidatedError(); _checkCaseRef(externalRef); if(evidenceHash==bytes32(0)) revert ZeroHash(); if(usedCaseRef[keccak256(bytes(externalRef))]) revert DuplicateCaseRef(); if(openCaseByWork[workId]!=0) revert PendingCaseExists(); id=nextCaseId++; usedCaseRef[keccak256(bytes(externalRef))]=true; cases[id]=CaseRecord(id,workId,externalRef,evidenceHash,msg.sender,uint64(block.timestamp),CaseStatus.Pending,CaseOutcome.None,bytes32(0),"",address(0),0,0,false); openCaseByWork[workId]=id; caseIds.push(id); casesByWork[workId].push(id); emit CaseOpened(id,workId,externalRef,evidenceHash,msg.sender); }
    function resolveCase(uint256 caseId,CaseOutcome outcome,bytes32 decisionHash,string calldata decisionSummary) external onlyOwner { CaseRecord storage c=cases[caseId]; if(c.id==0) revert NotFound(); if(c.status!=CaseStatus.Pending) revert CaseNotPending(); if(outcome!=CaseOutcome.Uphold&&outcome!=CaseOutcome.Invalidate) revert InvalidOutcome(); if(decisionHash==bytes32(0)) revert ZeroHash(); _checkBytes(decisionSummary,1,512); c.status=CaseStatus.Resolved;c.outcome=outcome;c.decisionHash=decisionHash;c.decisionSummary=decisionSummary;c.resolvedBy=msg.sender;c.resolvedAt=uint64(block.timestamp);c.rewardAmount=gasSubsidy+reviewReward;pendingCaseRewards+=c.rewardAmount;openCaseByWork[c.workId]=0; if(outcome==CaseOutcome.Invalidate){ Work storage w=works[c.workId]; w.invalidatedAt=uint64(block.timestamp);w.invalidatedByCaseId=caseId;activeWorkByHash[w.fileHash]=0;emit WorkInvalidated(c.workId,caseId,msg.sender,uint64(block.timestamp)); } emit CaseResolved(caseId,c.workId,outcome,decisionHash,msg.sender,c.rewardAmount); }
    function fundRewardPool() external payable { if(msg.value==0) revert NotPayableAmount(); rewardPoolBalance+=msg.value; emit RewardPoolFunded(msg.sender,msg.value,rewardPoolBalance); }
    function creditCaseReward(uint256 caseId) external { CaseRecord storage c=cases[caseId]; if(c.id==0) revert NotFound(); if(c.status!=CaseStatus.Resolved) revert CaseNotPending(); if(c.rewardCredited) revert RewardAlreadyCredited(); if(rewardPoolBalance<c.rewardAmount) revert InsufficientRewardPool(); c.rewardCredited=true;rewardPoolBalance-=c.rewardAmount;pendingCaseRewards-=c.rewardAmount;_credit(c.resolvedBy,c.rewardAmount,CreditSource.CaseReward,caseId);emit CaseRewardCredited(caseId,c.resolvedBy,c.rewardAmount); }

    function getWork(uint256 id) external view returns(Work memory){if(works[id].id==0)revert NotFound();return works[id];} function getOffer(uint256 id) external view returns(Offer memory){if(offers[id].id==0)revert NotFound();return offers[id];} function getLicense(uint256 id) external view returns(License memory){if(licenses[id].id==0)revert NotFound();return licenses[id];} function getCase(uint256 id) external view returns(CaseRecord memory){if(cases[id].id==0)revert NotFound();return cases[id];}
    function getWorkStatus(uint256 id) external view returns(WorkStatus){Work memory w=works[id];if(w.id==0)return WorkStatus.None;return w.invalidatedAt==0?WorkStatus.Active:WorkStatus.Invalidated;}
    function getOfferStatus(uint256 id) external view returns(OfferStatus){Offer memory o=offers[id];if(o.id==0)return OfferStatus.None;if(o.state==OfferStoredState.Accepted)return OfferStatus.Accepted;if(o.state==OfferStoredState.Closed){if(o.closeReason==OfferCloseReason.SellerCancelled)return OfferStatus.Cancelled;if(o.closeReason==OfferCloseReason.WorkInvalidated)return OfferStatus.Invalidated;return OfferStatus.Expired;}Work memory w=works[o.workId];if(w.invalidatedAt!=0&&w.invalidatedAt<o.acceptUntil)return OfferStatus.Invalidated;if(block.timestamp>=o.acceptUntil)return OfferStatus.Expired;return OfferStatus.Open;}
    function getLicenseStatus(uint256 id) external view returns(LicenseStatus){License memory l=licenses[id];if(l.id==0)return LicenseStatus.None;if(l.authorRevokedAt!=0)return LicenseStatus.AuthorRevoked;Work memory w=works[l.workId];if(w.invalidatedAt!=0&&w.invalidatedAt<l.endsAt)return LicenseStatus.WorkInvalidated;if(block.timestamp>=l.endsAt)return LicenseStatus.Expired;return LicenseStatus.Active;}
    function isLicenseValidAt(uint256 id,uint64 at) external view returns(bool){License memory l=licenses[id];if(l.id==0)revert NotFound();if(at>block.timestamp) revert InvalidAcceptUntil();Work memory w=works[l.workId];return l.startsAt<=at&&at<l.endsAt&&(l.authorRevokedAt==0||at<l.authorRevokedAt)&&(w.invalidatedAt==0||at<w.invalidatedAt);}
    function previewAuthorRevoke(uint256 id) external view returns(uint256 buyer,uint256 seller){License memory l=licenses[id];if(l.id==0)revert NotFound();if(l.settled||block.timestamp<l.startsAt||block.timestamp>=l.endsAt)revert LicenseNotActive();Offer memory o=offers[l.offerId];uint64 elapsed=uint64(block.timestamp)-l.startsAt;uint64 total=l.endsAt-l.startsAt;seller=(o.price*elapsed)/total;buyer=o.price-seller+o.compensation;}
    function previewSettlement(uint256 id) external view returns(bool canSettle,SettlementReason reason,uint256 buyer,uint256 seller){License memory l=licenses[id];if(l.id==0)revert NotFound();if(l.settled)return(false,l.settlementReason,0,0);Work memory w=works[l.workId];Offer memory o=offers[l.offerId];if(w.invalidatedAt!=0&&w.invalidatedAt<l.endsAt){return(true,SettlementReason.WorkInvalidated,o.price+o.compensation,0);}if(block.timestamp>=l.endsAt){return(true,SettlementReason.NormalExpiry,0,o.price+o.compensation);}return(false,SettlementReason.None,0,0);}
    function getAccounting() external view returns(uint256 contractBalance,uint256 locked,uint256 totalUserCredits,uint256 rewardPool,uint256 pendingRewards,uint256 surplus){contractBalance=address(this).balance;locked=totalLockedDeposits;totalUserCredits=totalClaimable;rewardPool=rewardPoolBalance;pendingRewards=pendingCaseRewards;uint256 obligations=locked+totalUserCredits+rewardPool;surplus=contractBalance>obligations?contractBalance-obligations:0;}
    function termsHash(uint256 offerId,uint256 workId,bytes32 fileHash,address seller,uint256 price,uint64 duration,uint256 compensation,uint64 acceptUntil,string calldata scope) public view returns(bytes32){return keccak256(abi.encode(uint256(block.chainid),address(this),offerId,workId,fileHash,seller,price,duration,compensation,acceptUntil,scope,keccak256(bytes(TERMS_VERSION))));}

    function getWorkIds(uint256 offset,uint256 limit) external view returns(uint256[] memory,uint256){return _page(workIds,offset,limit);} function getWorkIdsByRegistrant(address a,uint256 o,uint256 l) external view returns(uint256[] memory,uint256){return _page(worksByRegistrant[a],o,l);} function getWorkIdsByHash(bytes32 h,uint256 o,uint256 l) external view returns(uint256[] memory,uint256){return _page(worksByHash[h],o,l);} function getOfferIdsByWork(uint256 w,uint256 o,uint256 l) external view returns(uint256[] memory,uint256){return _page(offersByWork[w],o,l);} function getOfferIdsBySeller(address a,uint256 o,uint256 l) external view returns(uint256[] memory,uint256){return _page(offersBySeller[a],o,l);} function getLicenseIdsByWork(uint256 w,uint256 o,uint256 l) external view returns(uint256[] memory,uint256){return _page(licensesByWork[w],o,l);} function getLicenseIdsByLicensee(address a,uint256 o,uint256 l) external view returns(uint256[] memory,uint256){return _page(licensesByLicensee[a],o,l);} function getLicenseIdsByUserAndWork(address a,uint256 w,uint256 o,uint256 l) external view returns(uint256[] memory,uint256){return _page(licensesByUserWork[_userWorkKey(a,w)],o,l);} function getCaseIds(uint256 o,uint256 l) external view returns(uint256[] memory,uint256){return _page(caseIds,o,l);} function getCaseIdsByWork(uint256 w,uint256 o,uint256 l) external view returns(uint256[] memory,uint256){return _page(casesByWork[w],o,l);}

    function _isOfferOpen(Offer memory o) internal view returns(bool){if(o.state!=OfferStoredState.Open||block.timestamp>=o.acceptUntil)return false;Work memory w=works[o.workId];return w.invalidatedAt==0;}
    function _credit(address account,uint256 amount,CreditSource source,uint256 id) internal {if(amount==0)return;claimable[account]+=amount;totalClaimable+=amount;emit BalanceCredited(account,amount,source,id);}
    function _checkBytes(string memory value,uint256 min,uint256 max) internal pure {uint256 n=bytes(value).length;if(n<min)revert EmptyField();if(n>max)revert FieldTooLong();}
    function _hasHttpScheme(string memory value) internal pure returns(bool){bytes memory b=bytes(value);return (b.length>=7&&b[0]==0x68&&b[1]==0x74&&b[2]==0x74&&b[3]==0x70&&b[4]==0x3a&&b[5]==0x2f&&b[6]==0x2f)||(b.length>=8&&b[0]==0x68&&b[1]==0x74&&b[2]==0x74&&b[3]==0x70&&b[4]==0x73&&b[5]==0x3a&&b[6]==0x2f&&b[7]==0x2f);}
    function _checkCaseRef(string memory ref) internal pure {bytes memory b=bytes(ref);if(b.length<1||b.length>64)revert InvalidCaseRef();for(uint256 i;i<b.length;i++){bytes1 c=b[i];if(!((c>=0x30&&c<=0x39)||(c>=0x41&&c<=0x5A)||c==0x2D))revert InvalidCaseRef();}}
    function _page(uint256[] storage src,uint256 offset,uint256 limit) internal view returns(uint256[] memory out,uint256 total){if(limit<1||limit>50)revert InvalidPage();total=src.length;if(offset>=total)return(new uint256[](0),total);uint256 end=offset+limit;if(end<offset)end=total;if(end>total)end=total;out=new uint256[](end-offset);for(uint256 i;i<out.length;i++)out[i]=src[offset+i];}
    function _userWorkKey(address a,uint256 w) internal pure returns(bytes32){return keccak256(abi.encode(a,w));}
    receive() external payable { revert NotPayableAmount(); }
    fallback() external payable { revert NotPayableAmount(); }
}
