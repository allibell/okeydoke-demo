import { useMutation } from "react-query";
import { CredentialDerivedProof } from "../../models/credential";
import { verify, purposes } from "jsonld-signatures";
import { CryptoLD } from "crypto-ld";
import {
    Bls12381G2KeyPair,
    BbsBlsSignature2020,
    BbsBlsSignatureProof2020,
    deriveProof,
  } from "@mattrglobal/jsonld-signatures-bbs";
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';


// Prepare shitty crytpoLD library
// const cryptoLd = new CryptoLD();
// Install driver for Ed255192020
// cryptoLd.use(Ed25519VerificationKey2020);

type VerifyCredentialProps = {
    derivedProof: CredentialDerivedProof;
};

const handleVerifyCredential = async (
    derivedProof: VerifyCredentialProps["derivedProof"]
): Promise<any> => {
    console.log(JSON.stringify(derivedProof));
    // TODO: use Mattr's open source verify instead of Trinsic's
    // mattrglobal/jsonldsignatures
    // const proof = await new ProofSet(derivedProof.proof);
    // const key = new Ed25519KeyPair(derivedProof.proof.verificationMethod);
    // const key = await cryptoLd.generate({ type: 'Ed25519VerificationKey2020' });
    // const keyPair = await new Bls12381G2KeyPair();
    const suite = new BbsBlsSignature2020();
    const response = await verify(derivedProof.proof, {
        suite,
        purpose: new purposes.AssertionProofPurpose(),
    });
    // const response = await fetch(
    //     `${process.env.REACT_APP_VERIFY_ENDPOINT}/api/trinsic/verify`,
    //     {
    //         method: "POST",
    //         body: JSON.stringify(derivedProof),
    //     }
    // );
    // const response = await fetch(
    //     `${process.env.REACT_APP_VERIFY_ENDPOINT}/api/trinsic/verify`,
    //     {
    //         method: "POST",
    //         body: JSON.stringify(derivedProof),
    //     }
    // );
    console.log("@@@@ Response @@@@@");
    console.log(JSON.stringify(response));

    if (!response.ok) {
        console.log("@@@@ Uh Oh... @@@@@");
        throw Error("Unable to verify credential.");
    }

    return await response.json();
};

export const useVerifyCredential = (onError?: () => void) => {
    return useMutation(
        ({ derivedProof }: VerifyCredentialProps) =>
            handleVerifyCredential(derivedProof),
        {
            onSuccess: () => {},
            // TODO: Better error messaging
            onError: (err) => {
                window.alert(err);
                onError?.();
            },
        }
    );
};
