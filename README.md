Ionic Feeder
=====================

##An app to help out with breastfeeding.

##TODO:

* Send user id by email
* Input user-id
* Vibrate on 5 minute mark.
* Modify old feeding.
* Use a better ID
* Update counter in notifications.
* Split up controllers
* Sanitize models.js
* Move resync to model and have it throw events
* Make loading of slides dynamic instead of hardcoded (bug in ionic, see weird_auto_slides_bug branch)
* Rename the database. Demo? Really?
* ...

##BUGS:
* Are timezones going to be a real problem in using timestamps? Cross device?

##DONE:
* Store partials in db.
* Skip fullscreen - show status bar.
* Run in backgrund.
* Re-enter continues timer.
* Rename app
* Store status of row, continues on resume.
* Max feeding time.
* Buttons change content when toggled.
* Time since last feeding
* Sync with the interwebs.
* "Push all" button to sync all current feedings.
* Store syncs
* Merge sync better. Go back. 
* Show off ongoing feedings in sync
* Resuming app after a long sleep doesnt set duration to max time, it just pinches it off
* Resync on resume
* Quit doublesyncing
* Throw up some toasters when syncing.
* Feeding duration in minutes
* Time between feedings
* Style a bit.
* Mark next feeding
* Make a generic menu and move "upload all" button there
* Create user-id on startup if not created.

##Used plugins

    cordova plugin add org.apache.cordova.dialogs
    cordova plugin add https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git
    cordova plugin add https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin.git

