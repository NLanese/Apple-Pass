The point of this application is to be an anonymous cloud function where a request will return an Apple Pass 
This should be hosted via Firebase Functions as it is a Firebase Project. 

To recommit this file to the cloud, use 
     `firebase deploy --only functions` 
in the parent directory

To review any and all logs hit, use the `firebase functions:log` command 
in tbe parent directory. For more in-depth log commands, use the
     `firebase help functions:log` command
Or, more simply, use 
     `firebase functions:log --only functions` to see all the logs
