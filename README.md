<img width="782" height="319" alt="logo_header" src="https://github.com/user-attachments/assets/890c5b84-6ef8-4c3c-9ca0-2dbeefdf9aed" />

# Welcome to Lomito Buscador

## ¿What is this app about?

Lomito buscador is a mobile app created to help people find lost pets.

Collaboration is the main engine of this app.

### Main features:

- Register your own pets with extensive descriptions
  <img width="782" height="319" alt="logo_header" src="https://github.com/user-attachments/assets/8b791128-8c35-4820-a530-d16eac723851" />
- Register multiple pets
  <img width="591" height="1280" alt="image" src="https://github.com/user-attachments/assets/78bcbd78-c544-4107-bc6d-a50de46687bb" />
- If a pet gets lost can be reported with just one click!
 <img width="591" height="1280" alt="image" src="https://github.com/user-attachments/assets/31ba328b-5ddb-4280-a172-c3c6bd172883" />
 <img width="591" height="1280" alt="image" src="https://github.com/user-attachments/assets/922625c7-8334-43d0-a813-f480420b7a79" />

 as well, you'll get automatically a .jpg image with both your and your pet information (I know, it sucks to waste time making flyers)
<img width="591" height="1280" alt="image" src="https://github.com/user-attachments/assets/6341655d-f67d-45bb-ba74-171aa3bf4310" />

 Then, the registered users 40 km around you will be notified of the missing of your pet!
 
 Your pet will be listed in a public board of lost pets!
 <img width="591" height="1280" alt="image" src="https://github.com/user-attachments/assets/0cdb1c4a-84a5-42d0-90ac-d5acaa1136a5" />

 As well it will pinned on the map with the last seen location.
 <img width="591" height="1280" alt="image" src="https://github.com/user-attachments/assets/6168412d-2135-4962-aafc-0b4418591d81" />

If someone sees your pet around they can click on the pin or search for your pet on the board, and report the new sighting:

<img width="591" height="1280" alt="image" src="https://github.com/user-attachments/assets/1a80597e-06b1-43df-873d-54c0a4f3d5e1" />

The owner will be notified and the tracking route will be updated.

<img width="591" height="1280" alt="image" src="https://github.com/user-attachments/assets/13ec463e-82cc-4f8c-ac12-81609b7cca6f" />

They can also see your contact information if they manage to keep your pet safe. 

## Tech stack

This app was created with **Expo**, there were troubles trying to test Google auth but you can create your own.

**FAST API** was used for backend endpoints.

**Firebase and Firebase storage** were used as the database and the storge respectively.

**Ngrok** used as a tunnel to allow HTTP requests on Expo Go in Iphone

**React Native** was used for Frontend components.

## Running the app

After installing all necessary packages you will need to execute the following commands on your terminal.

~~~

#Initializes backend service

`uvicorn app.app:app -reload`


#Initializes Ngrok (in case you have to use it)

`ngrok http 8000`


#Initializes Frontend expo client:

`npx expo start -c`

~~~



Keep your beloved pets safe, cheers!
Néstor Q.








 




