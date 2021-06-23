import React from 'react'

import firebase from 'firebase';

import Moment from "moment";
import { extendMoment } from "moment-range";

const moment = extendMoment(Moment);

//logic is accurate but currently not being called anywhere need to figure out async problem in listingExplorer

const CheckIfAlreadyReserved = ({spotId, startDate, endDate}) => {

   

    console.log(spotId);
    
    var reserved;

   const dbRef = firebase.database().ref("Upcoming_Bookings");
    dbRef.child(spotId).on('value', (snapshot) => {
        if (snapshot.exists()) {
           

            snapshot.forEach((child) => {
              let bookingStart = new Date(child.child("startTime").val());
              let bookingEnd = new Date(child.child("endTime").val());
              let range = moment.range(bookingStart, bookingEnd);
              console.log(range);
              if(range.contains(startDate) || range.contains(endDate)) {
                  reserved = true;
                  return true;
              } else {
                reserved = false;
              }
            })
        } else {
            reserved = false;
        }
    });

    return reserved;

}

export  { CheckIfAlreadyReserved };