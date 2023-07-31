import React, { useEffect } from 'react';
import { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { TextInput } from 'react-native';

import firebase from "firebase/compat/app";
import "firebase/compat/auth";

import * as admin from 'firebase-admin';



// PKPass is the framework that will allow us to create a Pass in JS
const { PKPass } = require('passkit-generator')


// We are Using Firebase Functions (AWS LAmbda but Firebased) For Deployment
const functions = require('firebase-functions')


// For Retreiving the pkpass from storage
import { getStorage, ref, getDownloadURL, getStream } from "firebase/storage";


// File Navigation and Axios
var path = require('path')
import axios from "axios";

import BarcodeSecrets from './BarcodeSecrets';



/////////
// APP //
/////////
function App(){

  // Pass Details
  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [years, setYears] = useState("")
  const [date, setDate] = useState()

  // 
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    nDate = new Date()
    setDate(nDate)
  }, [])


///////////////
// Functions //
///////////////

  // Generates and Downloads PKPass
  function handleClick(){
    if (!loading){
      setLoading(true)
      console.log("Generating Pass")
      generatePass()
      .then( passResp => {
        console.log("Returning Request")
        if (passResp){
          console.log("Pass Creation Successful! \n Firebase Storage Path:", passResp.data.saveFilePath)
          downloadPassFirebase(passResp.data.saveFilePath)
          setLoading(false)
        }
        else{
          console.error("Pass And/Or Pass Save has Failed!")
          setLoading(false)
        }
      })
    }
  }

  // Sends the POST Request to Firebase Function to create the Apple Pass
  // via axios
  async function generatePass(){
    const data = {
        // Primary Fields for Pass 
        primary: {value: "123-456-7890"},

        // Secondary Fields for PAss
        secondary: [
          {value: "Test Section"},
          {value: "12-31-30"}
        ],

        // Auxiliary Fields for Pass
        auxiliary: [
          {value: "Johnny"},
          {value: "Test"}
        ],

        barcode: BarcodeSecrets(),
    }
    try{
      const response = await axios.post("https://us-central1-apple-pass-test.cloudfunctions.net/pass", data)
      if (response){
        return response
      }
    } catch (err){
      console.error(err)
    }
  }


  // Downloads the Pass from Firebase Storage
  function downloadPassFirebase(fbPath){
    // Create a reference to the file we want to download
    const storage = getStorage();
    const pkpassRef = ref(storage, fbPath);

    getStream(pkpassRef)
  }

//////////
// Main //
//////////
  return (
    <View style={{marginTop: 40}}>
      <View>
        <Text style={{marginTop: 40, fontSize: 20, fontWeight: 700, textAlign: 'center'}}>
          Enter information to make a pass
        </Text>
      </View>
      <View style={{marginLeft: '20%', marginRight: '20%', marginTop: 45}}>
        <Text style={{marginTop: 10}}>Name</Text>
        <TextInput style={{padding: 5, borderWidth: 1}}
          onChangeText={(content) => setName(content)}
        />
         <Text style={{marginTop: 10}}>Title</Text>
         <TextInput style={{padding: 5, borderWidth: 1}}
          onChangeText={(content) => setTitle(content)}
        />
        <Text style={{marginTop: 10}}>Years</Text>
         <TextInput style={{padding: 5, borderWidth: 1}}
          onChangeText={(content) => setYears(content)}
        />
      </View>
      <View style={{marginTop: 95}}>
        <Button
          title='Add To Wallet'
          onPress={() => handleClick()}
        />
      </View>
    </View>
  );
}


export default App;
