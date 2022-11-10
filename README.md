# CinemaApp

# Ελληνικά

## Cinema Web Application -  Backend Module

Link για [Frontend](https://github.com/George-Anto/cinema-app_frontend)

Το backend χειρίζεται όλη την επιχειρηματική λογική της εφαρμογής και επικοινωνεί με τη βάση δεδομένων, η οποία είναι mongoDB και λειτουργεί τόσο τοπικά, όσο και στο cloud - [Atlas](https://www.mongodb.com/cloud/atlas/lp/try4?utm_source=google&utm_campaign=search_gs_pl_evergreen_atlas_core_prosp-brand_gic-null_ww-multi_ps-all_desktop_eng_lead&utm_term=mongodb%20atlas&utm_medium=cpc_paid_search&utm_ad=e&utm_ad_campaign_id=12212624584&adgroup=115749713503&gclid=Cj0KCQiAmaibBhCAARIsAKUlaKRB-jFc7aPlOBcSVZwBc_3mdY1tFdxtHdb8tCQ5qnV0W8yWu38mZkYaAoCjEALw_wcB).<br/>
Εξυπηρετεί όλα τα απαραίτητα δεδομένα στο frontend και λαμβάνει και επεξεργάζεται όλες τις ενέργειες του χρήστη μέσω των endpoints του που χρησιμοποιεί το frontend.

Είναι υλοποιημένο με γνώμονα μερικές καλές πρακτικές (design patterns) όπως: <br/>
  1. Static Content Hosting 
  2. Valley Key
  3. Retry Pattern 
  
Επίσης, για το Static Content Hosting γίνεται χρήση του Azurite (emulator του Azure) το οποίο συνδέεται με το Mictosoft Azure Storage Explorer 
το οποίο αναλαμβάνει τον ρόλο τόσο της αποθήκευσης των αρχείων (εικόνων) των χρηστών της εφαρμογής μας, όσο και την ανάκτηση τους από αυτούς.  

# English

## Cinema Web Application - Backend Module

Link for [Frontend](https://github.com/George-Anto/cinema-app_frontend)

The backend handles all the business logic of the application and communicates with the database, which is mongoDB and works both locally and in the cloud - [Atlas](https://www.mongodb.com/cloud/atlas/lp/try4?utm_source=google&utm_campaign=search_gs_pl_evergreen_atlas_core_prosp-brand_gic-null_ww-multi_ps-all_desktop_eng_lead&utm_term=mongodb%20atlas&utm_medium=cpc_paid_search&utm_ad=e&utm_ad_campaign_id=12212624584&adgroup=115749713503&gclid=Cj0KCQiAmaibBhCAARIsAKUlaKRB-jFc7aPlOBcSVZwBc_3mdY1tFdxtHdb8tCQ5qnV0W8yWu38mZkYaAoCjEALw_wcB).<br/>
It serves all necessary data to the frontend and receives and processes all user actions through its endpoints that the frontend uses.

It is implemented based on some good practices (design patterns) such as: <br/>
  1. Static Content Hosting
  2. Valley Key
  3. Retry Pattern
  
Also, for the Static Content Hosting design pattern, we use the Azurite (Azure emulator) which is connected to Mictosoft Azure Storage Explorer
which takes on the role of both storing the files (images) of our application users and retrieving them for them.
