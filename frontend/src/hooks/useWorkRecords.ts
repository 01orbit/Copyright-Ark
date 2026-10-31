import { useReadContracts } from "wagmi";
import { abi, useMarket } from "../market";
import { useRecordIds } from "./useRecordIds";

export function useWorkRecords(workId: bigint) {
  const { address, chainId } = useMarket();
  const offerIds = useRecordIds(workId, "getOfferIdsByWork");
  const licenseIds = useRecordIds(workId, "getLicenseIdsByWork");
  const offers = useReadContracts({
    contracts: offerIds.ids.map((id) => ({
      address: address!, abi, functionName: "getOffer", chainId, args: [id],
    } as const)),
    allowFailure: false,
    query: { enabled: !!address && offerIds.ids.length > 0, refetchInterval: 10_000 },
  });
  const offerStatuses = useReadContracts({
    contracts: offerIds.ids.map((id) => ({
      address: address!, abi, functionName: "getOfferStatus", chainId, args: [id],
    } as const)),
    allowFailure: false,
    query: { enabled: !!address && offerIds.ids.length > 0, refetchInterval: 10_000 },
  });
  const licenses = useReadContracts({
    contracts: licenseIds.ids.map((id) => ({
      address: address!, abi, functionName: "getLicense", chainId, args: [id],
    } as const)),
    allowFailure: false,
    query: { enabled: !!address && licenseIds.ids.length > 0, refetchInterval: 10_000 },
  });
  const licenseStatuses = useReadContracts({
    contracts: licenseIds.ids.map((id) => ({
      address: address!, abi, functionName: "getLicenseStatus", chainId, args: [id],
    } as const)),
    allowFailure: false,
    query: { enabled: !!address && licenseIds.ids.length > 0, refetchInterval: 10_000 },
  });
  return {
    offers: (offers.data ?? []).map((offer, index) => ({ offer, status: offerStatuses.data?.[index] })),
    licenses: (licenses.data ?? []).map((license, index) => ({ license, status: licenseStatuses.data?.[index] })),
    loading: [offerIds, licenseIds].some((query) => query.loading)
      || [offers, offerStatuses, licenses, licenseStatuses].some((query) => query.isLoading),
    error: [offerIds, licenseIds, offers, offerStatuses, licenses, licenseStatuses].some((query) => query.error),
  };
}
