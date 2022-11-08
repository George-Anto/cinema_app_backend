# CinemaApp

## Cinema Web Application -  Backend Module

Link για [Frontend](https://github.com/George-Anto/cinema-app_frontend)

Το backend χειρίζεται όλη την επιχειρηματική λογική της εφαρμογής και επικοινωνεί με τη βάση δεδομένων.
Εξυπηρετεί όλα τα απαραίτητα δεδομένα στο frontend και λαμβάνει και επεξεργάζεται όλες τις ενέργειες του χρήστη μέσω των endpoints του που χρησιμοποιεί το frontend.

Είναι υλοποιημένο με γνώμονα μερικές καλές πρακτικές (design patterns) όπως: <br/>
  1. Static Content Hosting 
  2. Valley Key
  3. Retry Pattern 
  
Επίσης για το Static Content Hosting γίνεται χρήση του Azurite (emulator του Azure) το οποίο συνδέεται με το Mictosoft Azure Storage Explorer 
το οποίο αναλαμβάνει τον ρόλο τόσο της αποθήκευσης των αρχείων (εικόνων) των χρηστών της εφαρμογής μας, όσο και την ανάκτηση τους από αυτούς.  
