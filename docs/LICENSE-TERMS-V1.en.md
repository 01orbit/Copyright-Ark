# Standard license terms v1

[English](LICENSE-TERMS-V1.en.md) | [简体中文](LICENSE-TERMS-V1.md)

Version identifier: `CopyrightLicenseTerms/v1`. These terms apply to use licenses issued through the platform. [Full mechanism](COPYRIGHT-MECHANISM.md).

1. The licensed work is the content identified by the registered fingerprint of the offer's `workId`. Registration is a rights declaration, not platform verification of ownership.
2. The registrant grants the accepting wallet a time-limited, non-exclusive, non-transferable, non-sublicensable license, subject to the offer's `scope`.
3. Validity begins at the acceptance transaction's block time and ends at `endsAt`, in the interval `[startsAt, endsAt)`.
4. The buyer pays price `P`; the registrant previously locks deposit `D = P + C`, where `C` is fixed compensation. Each sender pays network gas. Creating several offers in one transaction does not merge their licenses or collateral.
5. At acceptance, buyer price `P` is credited to the registrant; deposit `D` remains locked. This price credit is not a deposit refund.
6. The registrant may terminate an active license early. For duration `T` and elapsed seconds, the contract computes `E = floor(P × elapsed / T)`, credits the buyer `P − E + C`, and credits the registrant `E`, all from the deposit. Termination and settlement occur in the same transaction.
7. On normal expiry, authorization ends without an expiry transaction. Anyone may trigger settlement, crediting `D` to the registrant. Delayed settlement or withdrawal does not extend the license.
8. If an administrator invalidates the registration pursuant to an off-chain decision before license expiry, the license ends immediately. Anyone may separately trigger settlement to credit all `D` to that buyer. Previously settled licenses are not compensated again; expiry preceding invalidation keeps its original outcome.
9. Credited funds require beneficiary-initiated withdrawal to transfer ETH. Settlement callers cannot change beneficiaries. An invalid status does not imply that allocation or withdrawal already happened.
10. Administrator case rewards use an explicitly funded, separately accounted pool, without deductions from buyer refunds or license deposits.
11. The system does not store or deliver original files, control devices, or automatically determine whether real-world usage complies with a license. Optional reference links are public metadata, not content verification.
12. Registering the same fingerprint after invalidation creates a new declaration. Old records, licenses and funds are retained and are not migrated.
13. Lookup reports platform authorization at a specified time. It does not replace ownership assessment, off-chain adjudication or applicable law.
