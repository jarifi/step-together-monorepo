###### Step (Together) by Step (Together) tutorial for Ios App Installing

# Test (If build has issues) all 17 checks need to pass
npx expo-doctor

# How to Build and upload to expo
eas build -p ios --profile production --clear-cache

# Publish to Testflight 
eas submit -p ios --profile production --latest

# How to set up App on TestFlight (Iphone)
Download testflight from the App-Store and click on the invite link (In your emails) for the Project to get acces to Installing the App.

Then install app and test it. If a new build has been submitten scroll down to "Versionen & Build-gruppen" then click on the newest version or any you want to test. 