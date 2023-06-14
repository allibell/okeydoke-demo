import { atom } from "recoil";
import { Product } from "../data/products";

export const isVerifyCredentialModalVisibleState = atom<boolean>({
    key: "verify-credential-modal-visible",
    default: false,
});

export const isRedirectErrorModalVisibleState = atom<boolean>({
    key: "redirect-error-modal-visible",
    default: false,
});

export const isRedirectVerifyCredentialErrorState = atom<boolean>({
    key: "redirect-verify-error",
    default: false,
});

export const selectedRateProductState = atom<Product | undefined>({
    key: "rate-product",
    default: undefined,
});

export const isVerifiedCredentialModalVisibleState = atom<boolean>({
    key: "verified-credential-modal-visible",
    default: false,
});

export const isIssueModalVisibleState = atom<boolean>({
    key: "issue-credential-modal-visible",
    default: false,
});

export const isIssueSuccessModalVisibleState = atom<boolean>({
    key: "issue-credential-success-modal-visible",
    default: false,
});

export const isLocalStorageModalVisibleState = atom<boolean>({
    key: "local-storage-modal-visible",
    default: false,
});
