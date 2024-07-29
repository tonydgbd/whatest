import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as serviceAccount from 'fourevent-ea1dc-firebase-adminsdk-umgvu-79c791d1c7.json';

// [
//   {
//       "typeTicket": [],
//       "ville": "Ouagadougou",
//       "nomLieu": "CENASA",
//       "endDate": {
//           "_seconds": 1722110340,
//           "_nanoseconds": 0
//       },
//       "organisateur": {
//           "phoneNumber": "54963888",
//           "responsable": "Oza",
//           "code_access": "",
//           "name": "OZA production",
//           "solde": 0,
//           "nombrevenement": 0,
//           "code_scanneur": "",
//           "events": []
//       },
//       "description": "Le concert, intitulé simplement \"Concert de FRANCKY FP\" (La Rencontre Des As), se tiendra le 27 juillet 2024 au CENASA à Ouagadougou, Burkina Faso à partir de 18h.\nLe CENASA avec une capacité de 600 places, Francky Fp offrira une ambiance unique et dynamique, idéale pour une rencontre inoubliable entre l'artiste et son public.\nCe concert marque une étape importante dans la carrière de FRANCKY FP, la sortie de son premier album, \"La Destinée des As\", sorti le 23 juin dernier.\nCet événement est une opportunité unique pour les fans de découvrir\nleur artiste en prestation sur les titres de ce nouvel album qui certainement marquerons la scène musicale burkinabé.\nObjectif: Offrir une expérience musicale inoubliable à un public diversifié, mettant en valeur le talent exceptionnel de FRANCKY FP, un artiste sollicité dans plusieurs festivals.\nCe concert vise également à renforcer la relation de l'artiste et ses fans à offrir une plateforme pour la promotion de la musique locale.",
//       "isOnline": false,
//       "need_reservation": false,
//       "eventLink": "",
//       "is_free": false,
//       "typeStands": [],
//       "category": "Concert",
//       "startDate": {
//           "_seconds": 1722092400,
//           "_nanoseconds": 0
//       },
//       "covers": [
//           "https://firebasestorage.googleapis.com/v0/b/fourevent-ea1dc.appspot.com/o/eventPictures%2Fdata%2Fuser%2F0%2Fcom.example.admin_event_pro%2Fcache%2F129c7171-011c-4968-a0c2-2c070a6e540e%2F1000684868.jpg?alt=media&token=e84648bf-bc3d-494a-9cab-5f072840b72f"
//       ],
//       "lieu": {
//           "_latitude": 12.3740709,
//           "_longitude": -1.5156582
//       },
//       "isVisible": true,
//       "isActive": true,
//       "name": "Gros Concert 🏆 Francky Fp •⁠ ⁠LA RENCONTRE DES AS •⁠"
//   }
// ]
@Injectable()
export class AppService {
  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL:
        'https://fourevent-ea1dc-default-rtdb.europe-west1.firebasedatabase.app',
    });
  }
  async getEvents(): Promise<any[]> {
    const date = new Date();
    console.log('date', date);
    const ev = [];
    const events = await admin
      .firestore()
      .collection('events')
      .where('endDate', '>', date)
      .get();
    events.forEach((doc) => {
      ev.push(doc.data());
    });
    return ev;
  }
}
