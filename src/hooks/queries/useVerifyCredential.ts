import { useMutation } from "react-query";
import { CredentialDerivedProof } from "../../models/credential";
import { verify, purposes, extendContextLoader } from "jsonld-signatures";
import { BbsBlsSignatureProof2020, deriveProof } from "@mattrglobal/jsonld-signatures-bbs";
import bbsContext from "./data/bbs.json";
import basicBbsContext from "./data/basic-bbs.json";
import credentialsContext from "./data/credentials.json";
import suiteContext from "./data/suiteContext.json";
import customIonIssuerContext from "./data/customIonIssuerContext.json";
import customIonIssuerContextJWK from "./data/customIonIssuerContextJWK.json";
import didResolutionContext from "./data/didResolutionContext.json";
import customBlsIssuerContext from "./data/customBlsIssuerContext.json";
import customBlsIssuerContextPubKey from "./data/customBlsIssuerContextPubKey.json";
import didContext from "./data/didContext.json";
import vcDiBbsContext from "./data/vcDiBbsContext.json";

const documents = {
    "https://w3id.org/security/bbs/v1": bbsContext,
    "https://w3id.org/bbs/v1": basicBbsContext,
    "https://www.w3.org/2018/credentials/v1": credentialsContext,
    "https://w3id.org/security/suites/jws-2020/v1": suiteContext,
    "https://w3id.org/did-resolution/v1": didResolutionContext,
    "https://www.w3.org/ns/did/v1": didContext,
    "did:ion:EiDa3yYaZFuVyKNQ42eHo6QuAqJKTBOaQwwaLx7RzcJODA": customIonIssuerContext,
    "did:ion:EiDa3yYaZFuVyKNQ42eHo6QuAqJKTBOaQwwaLx7RzcJODA#g2-public": customIonIssuerContextJWK,
    "did:key:z5TcCSFN1yToUnjYHJPrSDrLNVCUmRy2eLxWVNvHHA736QM49R1EggxpiLh9qF1koDyrJR52duyxK5tedGZ11eAvtEzJNc3ctxHfwPUiTBpcNQpG949b16GpyACbaiqPRSDNY5x2CxTsLZxdHfChJdVqPubw8iFnhj7nmYYd68ZuHeV7ZaNi2hGwB5hvhfohys2we5HYw": customBlsIssuerContext,
    "did:key:z5TcCSFN1yToUnjYHJPrSDrLNVCUmRy2eLxWVNvHHA736QM49R1EggxpiLh9qF1koDyrJR52duyxK5tedGZ11eAvtEzJNc3ctxHfwPUiTBpcNQpG949b16GpyACbaiqPRSDNY5x2CxTsLZxdHfChJdVqPubw8iFnhj7nmYYd68ZuHeV7ZaNi2hGwB5hvhfohys2we5HYw#zUC7LAH1NebNsVNmaLK1snAw87H2g2RURyEB1zC6dWaLaKSa8mdJq8jWGLD4P5HpYB3XqsNASd1wnk3MY6VZGvJ9J7mCnGQNTrpZdkjZRkSrak2oVwA9cC9fX1ktsLxrVirkA27": customBlsIssuerContextPubKey,
    "https://w3id.org/security/suites/bls12381-2020/v1": vcDiBbsContext,
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
    let proof;
    // TODO: use Mattr's open source verify instead of Trinsic's
    // Verify the proof
    console.log(JSON.stringify(derivedProof, null, 2));
    if (!derivedProof.proof.type.toLowerCase().includes("BbsBlsSignatureProof".toLowerCase())) {
        // we need to derive a proof actually
        // Derive a proof
        const revealDocument = {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://w3id.org/bbs/v1",
                {
                  "@vocab": "https://trinsic.cloud/okeydoke/"
                }
              ],
            "type": ["FoodSalvagerLicense", "VerifiableCredential"],
            "credentialSubject": {
              "id": {},
              "certificationGrade": {},
              "name": {},
              "produceType": {}
            }
          }
        proof = await deriveProof(derivedProof, revealDocument, {
            suite: new BbsBlsSignatureProof2020(),
            documentLoader,
        });

        console.log(JSON.stringify(derivedProof, null, 2));
    } else {
        proof = derivedProof
    }
    const suite = new BbsBlsSignatureProof2020();
    const response = await verify(proof, {
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
