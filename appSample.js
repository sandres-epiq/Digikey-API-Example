let clientId = "WkrUxUXEXGZsVxHOrOOGnHFvnFAjc16P";
let clientSecret = "bwkn4toDNDAnAnYY";
let accessToken;
// allValues gives the list of standard capacitance values
let allValues = [1, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2, 2.2, 2.4, 2.7, 3, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1, 10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91, 100, 110, 120, 130, 150, 160, 180, 200, 220, 240, 270, 300, 330, 360, 390, 430, 470, 510, 560, 620, 680, 750, 820, 910, 1000, 1100, 1200, 1300, 1500, 1600, 1800, 2000, 2200, 2400, 2700, 3000, 3300, 3600, 3900, 4300, 4700, 5100, 5600, 6200, 6800, 7500, 8200, 9100, 10000, 15000, 22000, 33000, 47000, 68000, 100000, 150000, 220000, 330000, 470000, 680000, 1000000];
let allSciValues = sciList();
let allSciValuesMod = sciListMod();
let outputLib = [];
let toggle = false;
let redirectURI = "https://www.google.com"



function formatCookies(element){
    document.cookie = element + "=" + document.getElementById(element).value + "; ";
} //Called whenever a dropdown element is changed. The chosen value is stored in the page's cookie, so that whenever the site is reloaded this is the default value.

function applyCookies(){
    let currentCookies = parseCookie();
    for(const property in currentCookies){
        if(document.getElementById(property) != null){
            document.getElementById(property).value = currentCookies[property];
        }
    }
} //Called when the site is loaded. Applies any dropdown defaults stored in the page's cookie.

const parseCookie = () => //Returns an object with each name-value pair from the page's cookie
    document.cookie
        .split(';')
        .reduce((res, c) => {
            const [key, val] = c.trim().split('=').map(decodeURIComponent)
            try {
                return Object.assign(res, { [key]: JSON.parse(val) })
            } catch (e) {
                return Object.assign(res, { [key]: val })
            }
        }, {});



document.getElementById("go").addEventListener("click", function() {

    document.cookie = "websiteState=go";
    window.location.assign("https://api.digikey.com/v1/oauth2/authorize?response_type=code&client_id=" + clientId + "&redirect_uri=" + encodeURIComponent(redirectURI))

}); //Whenever a person presses the 'go' button, the auth process begins. To do this, the code redirects the window to a certain digikey url, encoded with both the client id and the redirect url. (The next step occurs in the onload event)

window.addEventListener('load', function(){
    if(window.location.href.includes("code=") && parseCookie().websiteState == "go"){

        document.cookie = "websiteState=running"

        applyCookies();
        let loc = window.location.href;
        beginAuth(loc.substring(loc.indexOf("code=") + 5, loc.indexOf("&scope=")));  //Grabbing the returned auth code, which is encoded in the end of this website's url, and sending it to the beginAuth function
    }
}); //After the first step of auth, digikey redirects back to this site. An auth code used in authentication is encoded in the url.

function beginAuth(authCode){

    let url = "https://api.digikey.com/v1/oauth2/token";

    let xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            authComplete(xhr);
        }
    };

    let data = "code=" + authCode + "&client_id=" + clientId.toString() +
        "&client_secret=" + clientSecret.toString() + "&grant_type=authorization_code&" +
        "redirect_uri=" + encodeURIComponent(redirectURI)
    xhr.send(data);

} //With the auth code acquired previously, beginAuth uses a POST request to get back an access token that is used in every request sent to digikey. In the AuthComplete function, this access token is received and stored locally.

function authComplete(xhr) {

    let response = JSON.parse(xhr.responseText);

    if("ErrorMessage" in response){
        throw(" - " + response.ErrorMessage + " (" + response.ErrorDetails + ")")
    }
    else{
        accessToken = response.access_token;
        console.log("client id: " + clientId + "\n\nrefresh timeout: " + response.refresh_token_expires_in + "\naccess timeout: " + response.expires_in + "\nrefresh token: " + response.refresh_token + "\naccess token: " + response.access_token);
    }

    startSearching();

} //After AuthComplete gets the access token back from digikey, it starts the desired searches.



function startSearching(){
    for(let i = 0; i < allValues.length; i++) {
        let name =
            JSON.parse(`{
                "Name": "` + allSciValues[i] + ` ???% ` + document.getElementById('voltage').value + ` ` + document.getElementById('package').value + ` ` + document.getElementById('di').value + `",` +
                `"Value": "` + allSciValues[i] + `"}`
            );
        outputLib[i] = name; //Each capacitance value is an item in the outputLib array. This array stores each piece of information that is displayed in the output text box.
    }

    for(let i = 0; i < allValues.length; i++){ //Begins searching for each value of capacitance in the allValues array
        partFinder3000(i)
    }
}

function partFinder3000(index){
    let url = "https://api.digikey.com/Search/v3/Products/Keyword";

    let xhr = new XMLHttpRequest();
    xhr.open("POST", url); //This POST request is the actual digikey search

    xhr.setRequestHeader("accept", "application/json");
    xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
    xhr.setRequestHeader("X-DIGIKEY-Client-Id", clientId);
    xhr.setRequestHeader("Content-Type", "application/json")
    xhr.send(JSON.stringify({

        "Keywords": "capacitor",
        "RecordCount": 10,
        "RecordStartPosition": 0,
        "Filters": {
            "ParametricFilters": [
                { //Category: caps
                    "ParameterId": -3,
                    "ValueId": "3"
                },
                { //Product status: active
                    "ParameterId": 1989,
                    "ValueId": "0"
                },
                { //Temp coefficient: dependent on user choice
                    "ParameterId": 17,
                    "ValueId": document.getElementById("di").options[document.getElementById("di").selectedIndex].getAttribute("valueid")
                },
                { //Package size: dependent on user choice
                    "ParameterId": 16,
                    "ValueId": document.getElementById("package").options[document.getElementById("package").selectedIndex].getAttribute("valueid")
                },
                { //Voltage rating: dependent on user choice
                    "ParameterId": 14,
                    "ValueId": document.getElementById("voltage").options[document.getElementById("voltage").selectedIndex].getAttribute("valueid")
                },
                { //Capacitance: each capacitance value in the allSciValuesMod is searched for
                    "ParameterId": 2049,
                    "ValueId": allSciValuesMod[index]
                }
            ]
        },
        "Sort": {
            "SortOption": "SortByQuantityAvailable",
            "Direction": "Descending",
            "SortParameterId": 0
        },
        "ExcludeMarketPlaceProducts": true
    })); //The protocol for this JSON structure is defined in the digikey API documentation


    xhr.onreadystatechange = function (){
        if (xhr.readyState === 4) {
            outputLib[index] = {...outputLib[index], ...JSON.parse(xhr.responseText)} //Adds the information received from digikey into the proper outputLib object. Now all the information is stored in one combined object

            if("Products" in outputLib[index]){ //This ensures that if there was an error with receiving information from a part, the code will not attempt to process that part's data
                let ItemReport = {
                    "ItemReport": outputLib[index].Products.length //Item report is the number of products available for a certain capacitance
                }
                outputLib[index] = {...outputLib[index], ...ItemReport}

                if(outputLib[index].Products.length > 0){ //Inserting a tolerance and temp coefficient value into the name of the capacitor. The values are taken from the first listed product from the search.
                    if(outputLib[index].Products[0].Parameters.find(item => item.ParameterId === 3) != undefined){
                        outputLib[index].Name = outputLib[index].Name.replace("???%", outputLib[index].Products[0].Parameters.find(item => item.ParameterId === 3).Value)
                    }
                    if(outputLib[index].Products[0].Parameters.find(item => item.ParameterId === 17) != undefined){
                        outputLib[index].Name = outputLib[index].Name.replace("???", outputLib[index].Products[0].Parameters.find(item => item.ParameterId === 17).Value)
                    }
                }
            }
            else{
                console.log("hold on partner, we got a problem with " + index);
            }

            populateOutput();

        }
    };

}

function populateOutput(){

    let textOutput = "";
    for(let i = 0; i < allSciValues.length; i++){
        if(i > 0){
            textOutput += "\n";
        }
        if(toggle) {
            textOutput += "(" + allSciValues[i] + ") ";
        }

        if(document.getElementById("info").value == "DigiKeyPartNumber"){
            if("Products" in outputLib[i] && outputLib[i].Products.length > 0){
                textOutput += outputLib[i].Products[0].DigiKeyPartNumber;
            }
            else{
                textOutput += "no part options";
            }

        }
        else if(document.getElementById("info").value == "DetailedDescription"){
            if("Products" in outputLib[i] && outputLib[i].Products.length > 0){
                textOutput += outputLib[i].Products[0].DetailedDescription;
            }
            else{
                textOutput += "no part options";
            }
        }
        else if(outputLib[i] != undefined){
            textOutput += outputLib[i][document.getElementById("info").value];
        }
        else{
            textOutput += "undefined"
        }

    }

    document.getElementById("output").value = textOutput;

} //Fills in the output text box with whatever the desired information is



//These functions generate the standard capacitor values in scientific notation. The sciListMod and sciNotMod use a modified scientific notation that digikey uses, and so these are needed for the actual searching process.
function sciList() {

    let output = []
    for(let i = 0; i < allValues.length; i++){
        output.push(sciNot(allValues[i]));
    }

    return output;

}

function sciListMod() {

    let output = []
    for(let i = 0; i < allValues.length; i++){
        output.push(sciNotMod(allValues[i]));
    }

    return output;

}

function sciNot(input){ //NOTE - the input should be in pF. This works for values 1 pF <= value < 100 μF.
    if(1 <= input && input < 10){
        return(Number(input).toFixed(1) + " pF");
    }
    else if(10 <= input && input < 1000){
        return(Number(input).toFixed(0) + " pF");
    }
    else if(1000 <= input && input < 10000){
        return(Number(input / 1000).toFixed(1) + " nF");
    }
    else if(10000 <= input && input < 1000000){
        return(Number(input / 1000).toFixed(0) + " nF");
    }
    else if(1000000 <= input && input < 10000000){
        return(Number(input / 1000000).toFixed(1) + " μF");
    }
    else if(10000000 <= input && input < 100000000){
        return(Number(input / 1000000).toFixed(0) + " μF");
    }
    else{
        return null;
    }
}

function sciNotMod(input){ //NOTE - the input should be in pF. This works for values 1 pF <= value < 100 μF. The 'mod' indicates that this outputs only in pF and μF, skipping over nF.
    if(1 <= input && input < 10){
        return(Number(input).toFixed(1) + " pF");
    }
    else if(10 <= input && input <= 10000){
        return(Number(input).toFixed(0) + " pF");
    }
    else if(10000 < input && input < 100000){
        return(Number(input / 1000000).toFixed(3) + " μF");
    }
    else if(100000 <= input && input < 1000000){
        return(Number(input / 1000000).toFixed(2) + " μF");
    }
    else if(1000000 <= input && input < 10000000){
        return(Number(input / 1000000).toFixed(1) + " μF");
    }
    else if(10000000 <= input && input < 100000000){
        return(Number(input / 1000000).toFixed(0) + " μF");
    }
    else{
        return null;
    }
}



document.getElementById("toggle").addEventListener("click", function(){
    toggle = !toggle;
    populateOutput();
}); //Toggles the display of an index next to each item in the output text box

document.getElementById("info").addEventListener("change", function(){
    formatCookies("info");
    populateOutput();
}); //Called whenever the "Information to get" dropdown is changed. Both updates the values in the output text box and updates the page's cookie.