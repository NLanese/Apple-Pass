// To deploy this function use `firebase deploy --only functions` in the root directory


// PKPass is the framework that will allow us to create a Pass in JS
const { PKPass } = require('passkit-generator')

// We are Using Firebase Functions (AWS LAmbda but Firebased) For Deployment
const functions = require('firebase-functions')
const admin = require('firebase-admin')

var fs = require('file-system')
var path = require('path')
var axios = require('axios')


// Gives Admin Firebase Permissions to the Firebase Storage
admin.initializeApp({
    storageBucket: "apple-pass-test.appspot.com"    // Sets the specific firebase storage buck ID
});

// This Variable will be the Firebase Cloud Storage
const storageRef = admin.storage().bucket()


// Grabs all PEM Certificates
function getCertificates(){
    const wwdr = fs.readFileSync(path.join(__dirname, 'certs', 'wwdr.pem'));
    const signerCert = fs.readFileSync(path.join(__dirname, 'certs', 'sign\erCert.pem'));
    const signerKey = fs.readFileSync(path.join(__dirname, 'certs', 'signerKey.pem'));

    return { wwdr, signerCert, signerKey };
}

const {wwdr, signerCert, signerKey} = getCertificates()

///////////////////
// MAIN FUNCTION //
///////////////////
exports.pass = functions.https.onRequest((request, response) => {

    console.log("============================")
    // console.log("FULL REQUEST::::", request, "\n*\n*\n*")
    console.log("REQUEST BODY::: ", request.body, "\n*\n*\n*")
    console.log("Organizer Name: Ostrich Development")
    console.log("REQUEST - Serial Number: ", request.body.serialNumber);
    console.log("REQUEST - Header :", request.body.header);
    console.log("REQUEST - Primary :", request.body.primary);
    console.log("REQUEST - Secondary :", request.body.secondary);
    console.log("REQUEST - Auxiliary :", request.body.auxiliary);
    console.log("============================")

    // Create a PKPass Object that can be used in JS via Passkit-Generator
    const newPass = PKPass.from(
    {
        model: "./model.pass",

        // Certificates
        certificates: {                 // Paths to Certificates NEEDS file-system 
            wwdr: wwdr,
            signerCert: signerCert,
            signerKey: signerKey,
            signerKeyPassphrase: "N@l071737"
        }
    },

        // this object is the second parameter in the FROM function
        // This holds the information you want to add / overwrite in the pass.json
        {   
            webServiceURL: "https://us-central1-apple-pass-test.cloudfunctions.net/pass",        // This is the webservice (API / Lambda) address where this program will be located
            description: "This is a test description!",
            logoText: "Logo Text Here",
            organizationName: "Ostrich Development"
        }
    )
    // After Raw Pass Generation
    .then(async (newPass) => {

        console.log("Empty Pass Initialized...")

        ////////////////////////////
        // Optional Pass Settings //
        ////////////////////////////
            if (request.serialNumber){
                newPass.serialNumber = request.serialNumber
            }

            if (request.authenticationToken){
                newPass.authenticationToken = request.authenticationToken
            }

            console.log("Optional configs added")

        /////////////////
        // Pass Fields //
        /////////////////

            // Adds to Header Field(s)
            console.log("Header Object From Request")
            console.log(request.header)
            newPass.headerFields.push(
                {
                    label: request.header[0].label,      // Finds the primaryFields.label value from the request
                    value: request.header[0].value,       // Finds the primaryFields.value value from the request
                    key: request.header[0].key
                },
                (request.header.length > 1 ? ({
                    label: request.header[1].label,      
                    value: request.header[1].value, 
                    key: request.header[1].key 
                }) : null)
            )
            console.log("Header added...")

            // Adds to Primary Field(s)
            newPass.primaryFields.push(
                {
                    label: request.primary[0].label,      // Finds the primaryFields.label value from the request
                    value: request.primary[0].value,      // Finds the primaryFields.value value from the request
                    key: request.primary[0].key
                },
                (request.primary.length > 1 ? ({
                    label: request.primary[1].label,      
                    value: request.primary[1].value, 
                    key: request.primary[1].key
                }) : null)
            )
            console.log("Primary added...")

            // Adds to Secondary Field(s)
            newPass.secondaryFields.push(
                {
                    value: request.secondary[0].value,
                    label: request.secondary[0].label, 
                    key: request.secondary[0].key
                },
                (request.secondary.length > 1 ? ({
                    label: request.secondary[1].label,      
                    value: request.secondary[1].value, 
                    key: request.secondary[1].key 
                }) : null)
            )
            console.log("Secondary added...")

            // Adds to Auxiliary Field(s)
            newPass.auxiliaryFields.push(
                {
                    value: request.auxiliary[0].value,
                    label: request.auxiliary[0].label, 
                    key: request.auxiliary[0].key
                },
                (request.header.length > 1 ? ({
                    label: request.header[1].label,      
                    value: request.header[1].value, 
                    key: request.auxiliary[1].key 
                }) : null)
            )
            console.log("Auxiliary added...")
  

        /////////////
        // Barcode //
        /////////////

            console.log("Setting Barcodes")
            newPass.setBarcodes(
                {
                message: `Member Name: ${request.miscData.firstName} ${request.miscData.lastName}\nMember Number: ${request.miscData.memberNumber}\nExpiration: ${request.miscData.expiration}`,
                format: "PKBarcodeFormatQR",
                }, 
            );
            console.log("Barcodes complete")

        ////////////////
        // Expiration //
        ////////////////
        
            // Turns String into Date Object
            let functionalExpiration = new Date(request.miscData.expiration)
            
            // Adds 2 months to expiraation as this is when the pass would be invalidated
            let expMonth = functionalExpiration.getMonth() + 2
            functionalExpiration.setMonth(expMonth)
            
            // printing
            console.log("Functionl Expiration...")
            console.log(functionalExpiration)
            
            // Sets the Pass Expiration
            newPass.setExpirationDate(functionalExpiration)

        /////////////////////
        // Saving the Pass //
        /////////////////////

            console.log("Saving the Pass, process starting now...")

            // Creates Buffer version of Pass to be saved
            const bufferData = newPass.getAsBuffer();

            console.log("Pass to Buffer done.")

            // Encode the PKPass data to Base64 to be returned to client
            const base64Data = bufferData.toString("base64");

            console.log("Buffer to base64 done.")

            // Value for the path in Cloud Storage where the PKPass will be saved
            let serialNumber = request.body.serialNumber ? request.body.serialNumber : "00000"
            const saveFilePath = `passes/Tutorial${serialNumber}.pkpass`

            // Accesses or Creates 'passes' directory in Firebase Storage
            // Saves the bufferData to `passes/Tutorial.pkpass`
            storageRef.file(saveFilePath)
            .save(bufferData, (error) => {

                // Save Failed
                if (!error) {
                    console.log("Saved Successfully! \n Save to: ", saveFilePath);
                    console.log("Returning body should includea response of length...")
                    console.log(base64Data.length)
                    // response.status(200).send({ pkpassData: base64Data, saveFilePath: saveFilePath });
                    response.status(200).send({ base64: base64Data });
                } 
                
                // Save Succeeded
                else {
                    console.log("Pass created and fields added, but the final step failed");
                    console.log(error);
                    response.status(500).send({ error: "Failed to save PKPass to Firebase Storage." });
                }
            });

        ////////////////////////
        // RETURNING THE PASS //
        ////////////////////////
    })
    // Error Catching
    .catch(err => {
        console.log("Pass Creation Failed!")
        console.log(err)
        console.error(err)
    })
})