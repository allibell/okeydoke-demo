import { useMutation } from "react-query";
import { CredentialDerivedProof } from "../../models/credential";
import { verify, purposes, extendContextLoader } from "jsonld-signatures";
import { BbsBlsSignatureProof2020 } from "@mattrglobal/jsonld-signatures-bbs";
import bbsContext from "./data/bbs.json";
import basicBbsContext from "./data/basic-bbs.json";
import credentialsContext from "./data/credentials.json";
import suiteContext from "./data/suiteContext.json";
import customIonIssuerContext from "./data/customIonIssuerContext.json";
import customIonIssuerContextJWK from "./data/customIonIssuerContextJWK.json";
import didResolutionContext from "./data/didResolutionContext.json";
import didContext from "./data/didContext.json";

const documents = {
    "https://w3id.org/security/bbs/v1": bbsContext,
    "https://w3id.org/bbs/v1": basicBbsContext,
    "https://www.w3.org/2018/credentials/v1": credentialsContext,
    "https://w3id.org/security/suites/jws-2020/v1": suiteContext,
    "https://w3id.org/did-resolution/v1": didResolutionContext,
    "https://www.w3.org/ns/did/v1": didContext,
    "did:ion:EiDa3yYaZFuVyKNQ42eHo6QuAqJKTBOaQwwaLx7RzcJODA": customIonIssuerContext,
    "did:ion:EiDa3yYaZFuVyKNQ42eHo6QuAqJKTBOaQwwaLx7RzcJODA#g2-public": customIonIssuerContextJWK,
};

const customDocLoader = async (url: string) => {
    // @ts-ignore
    const context: any = documents[url];

    if (context) {
        return {
            contextUrl: null, // this is for a context via a link header
            document: context, // this is the actual document that was loaded
            documentUrl: url, // this is the actual context URL after redirects
        };
    }

    console.log(
        `Attempted to remote load context : '${url}', please cache instead`
    );
    throw new Error(
        `Attempted to remote load context : '${url}', please cache instead`
    );
};

//Extended document load that uses local contexts
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const documentLoader = extendContextLoader(customDocLoader);

type VerifyCredentialProps = {
    derivedProof: CredentialDerivedProof;
};

const handleVerifyCredential = async (
    derivedProof: VerifyCredentialProps["derivedProof"]
): Promise<any> => {
    // TODO: use Mattr's open source verify instead of Trinsic's
    // Verify the proof
    console.log(JSON.stringify(derivedProof, null, 2));
    const suite = new BbsBlsSignatureProof2020();
    const response = await verify(derivedProof, {
        suite: suite,
        purpose: new purposes.AssertionProofPurpose(),
        documentLoader
    });
    console.log(JSON.stringify(response));

    if (!response.verified) {
        throw Error("Unable to verify credential.");
    } else {
        return {
            isValid: true,
            validationMessages: [],
            validationResults: {
                CredentialStatus: { isValid: true, messages: [] },
                IssuerIsSigner: { isValid: true, messages: [] },
                SchemaConformance: { isValid: true, messages: [] },
                SignatureVerification: { isValid: true, messages: [] }
            }
        };
    }

};

export const useVerifyCredential = (onError?: () => void) => {
    return useMutation(
        ({ derivedProof }: VerifyCredentialProps) =>
            handleVerifyCredential(derivedProof),
        {
            onSuccess: () => { },
            // TODO: Better error messaging
            onError: (err) => {
                window.alert(err);
                onError?.();
            },
        }
    );
};
