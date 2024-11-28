import { Injectable } from '@nestjs/common';
import utils from './utils';
import * as admin from 'firebase-admin';
import { randomInt } from 'crypto';

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
type typeTicket = {
  showqty: boolean;
  hiddenuntil: {
    _seconds: number;
    _nanoseconds: number;
  };
  prix: number;
  name: string;
  description: string;
  isLiveOnly: boolean;
  participants: string[];
  isLive: boolean;
  hasLive: boolean;
  liveID: string;
  isfree: boolean;
  price_per_status: number[];
  free_for_status: number;
  dateDebutValidite: {
    _seconds: number;
    _nanoseconds: number;
  };
  dateFinValidite: {
    _seconds: number;
    _nanoseconds: number;
  };
  hiddenAfter: {
    _seconds: number;
    _nanoseconds: number;
  };
  quantity: number;
  vente: number;
};

@Injectable()
export class AppService {
  constructor() {}
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
  async getTypeTickets(name: string): Promise<typeTicket[]> {
    const date = new Date();
    console.log('date', date);
    const ev = [];
    const events = await admin
      .firestore()
      .collection('events')
      .where('name', '==', name)
      .get();
    const typeticket = await events.docs[0].ref.collection('typeTicket').get();
    typeticket.forEach((doc) => {
      ev.push(doc.data());
    });
    return ev;
  }
  async saveEventImageID(
    eventImageUrl: string,
    eventname: string,
    WhatsApp: string,
  ): Promise<any> {
    console.log('saveEventImageID', eventImageUrl, eventname);
    const { id } = await utils.uploadImage(eventImageUrl, WhatsApp);
    console.log('id', id);
    const eventRef = await admin
      .firestore()
      .collection('events')
      .where('name', '==', eventname)
      .get();
    console.log('eventRef', eventRef.docs.length);
    if ((await eventRef).docs.length > 0) {
      const event = (await eventRef).docs[0].data();
      event.covers = [...event.covers, id];
      await eventRef.docs[0].ref.update({
        imageID: id,
      });
      return id;
    } else {
      throw new Error(`No event found with name: ${eventname}`);
    }
  }
  getQrcodeLink(id: string) {
    return `https://quickchart.io/qr?text=${id}&ecLevel=H&margin=2&size=500&centerImageUrl=https%3A%2F%2Feasypass-bf.com%2Fimages%2Fupload%2F667c2fb052d3e.png`;
  }

  async createTicket(
    eventname: string,
    ticketname: string,
    phonenumber: string,
    codeparain: string | null,
    WA_PHONE_NUMBER_ID: string,
  ) {
    try{
    //creation of ticket
    const ticket = {
      code: '',
      isActive: true,
      isValid: true,
      typeTicket: {},
      cover: '',
      event: {},
    };
    const event = await admin
      .firestore()
      .collection('events')
      .where('name', '==', eventname)
      .get();
    const ev = event.docs[0];
    ticket.event = ev.data();
    ticket.cover = ev.data().covers[0];
    const types = await ev.ref
      .collection('typeTicket')
      .where('name', '==', ticketname)
      .get();
    const typ = types.docs[0];
    ticket.typeTicket = typ.data();
    ticket.code = `${ev.id}${randomInt(99999999)}Whatsapp${phonenumber}`;
    try {
      await typ.ref.update({
        vente: admin.firestore.FieldValue.increment(1),
        quantity: admin.firestore.FieldValue.increment(-1),
        participants: admin.firestore.FieldValue.arrayUnion(phonenumber),
      });
      await admin
          .database()
          .ref('ticket')!
          .child(ticket.code)
          .set({ active: true });
        return ticket.code;
    } catch (e) {
      console.error(e);
      console.log(e);
    }
    // update Parrain sales
   const ambasadeurs =  await admin.firestore().collection('ambassadeurs').where('code', '==', codeparain.trim().toLowerCase()).get();
    if(ambasadeurs.docs.length > 0){
      const amb = ambasadeurs.docs[0];
      await amb.ref.update({
        vente: admin.firestore.FieldValue.increment(1),
        buyers: admin.firestore.FieldValue.arrayUnion(phonenumber),
      });
    }else{
      console.log('no ambasadeur found');
      //save the code in the database
      await admin.firestore().collection('ambassadeurs').add({
        code: codeparain.trim().toLowerCase(),
        vente: 1,
        buyers: [phonenumber],
        affiliations:0,
        nom: '',
      }); 
    
    }
      //send Message to Organiseur when a ticket is sold
  const orgNumber = `226${ev.data().organisateur.phoneNumber}`;
  console.log('orgNumber', orgNumber);
  console.log('phonenumber', phonenumber);

  var message = `Un ticket a été vendu pour l'événement ${ev.data().name} au numéro ${phonenumber} \n 
  `;
  types.docs.forEach((doc) => {
    message += `Nombre de ticket vendu pour ${doc.data().name}: ${doc.data().vente} \n`;
  });

  console.log('message', message);
  await utils.sendText(orgNumber,WA_PHONE_NUMBER_ID, message);
}catch(e){
  console.error(e);
  console.log(e);
}
  }

}
