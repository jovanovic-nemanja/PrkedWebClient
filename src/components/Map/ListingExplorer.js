import React from "react";
import firebase from "firebase/app";
import { GeoFire } from "geofire";
import { Drawer, Tabs, Tab, withStyles } from "@material-ui/core";
import Map from "../Map/Map";
import ListingsContainer from "../Map/ListingsContainer";
import { SpaceAvailabilityCheck } from "../../util/SpaceAvailabilityCheck";
import { CheckIfAlreadyReserved } from "../../util/CheckIfAlreadyReserved";
import Moment from "moment";
import { extendMoment } from "moment-range";

const moment = extendMoment(Moment);

const styles = (theme) => ({
  listings: {
    display: 'block',
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  listingsMobile: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'block'
    }
  },
  listingsPaper: {
    top: 150,
    width: theme.layout.listingBar.width,
    background: "#efefef",
    boxShadow: "0 0 2px 1px rgb(0 0 0 / 20%)",
  },
  tabs: {
    margin: "0 10px",
    borderBottom: "1px solid #cdd3db",
    zIndex: -1
  },
  tab: {
    minWidth: "unset",
  },
  mapArea: {
    marginLeft: theme.layout.listingBar.width,
    [theme.breakpoints.down('sm')]: {
      marginLeft: 0
    }
  },
});

class ListingExplorer extends React.Component {
  constructor(props) {
    super(props);

    console.log("props into listings explorer");
    console.log(props);

    this.state = {
      listings: [],
      chosenLocation: props.chosenLocation,
      timeDelta: props.timeDelta,
      startDate: props.startDate,
      endDate: props.endDate,
      tabValue: 0,
    };
  }

  changeTime = (start, end) => {
    /* this.setState({
      listings: [],
      startDate: start,
      endDate: end,
      timeDelta: end - start,
    });*/

    this.getListings(0);
    this.render();
  };

    async getListings(n) {
    console.log("2");
    // TO DO
    // make it so it pulls 10 listings at a time, starting at n*10
    // having a page feature, where you click next, get 10
    // to save $$$ on firebase pulls
    let database = firebase.database();
    var upcoming = [];

    //ref to 'Upcoming_bookings' in firebase
    let dbRef = firebase.database().ref("Upcoming_Bookings");



    //Firebase ref to 'spots' location
    let spotRef = database.ref("Spots");

    //Geofire ref for location query
    var geoFire = new GeoFire(spotRef);

    //Coordinates from user's search locations
    var lat = this.props.chosenLocation.lat;
    var lng = this.props.chosenLocation.lng;
    var coords = [lat, lng];
    console.log(`this is the coords!!!!!  ${coords}`);

    //Stores keys of spots within the search radius
    var spotKeys = [];

    // Create a GeoQuery centered at search location with radius = 40km
    var geoQuery = geoFire.query({
      center: coords,
      radius: 40,
    });

    //Used to compare user's time range with each spot's availability to only display spots that are available during that time
    let startDate = this.props.startDate;
    let endDate = this.props.endDate;

    //For every spot in the query the spotId is pushed to spotKeys[] and prints info for testing purposes
    var onKeyEnteredRegistration = geoQuery.on(
      "key_entered",
      function (key, location, distance) {
        console.log("5");
        console.log(
          key +
          " entered query at " +
          location +
          " (" +
          distance +
          " km from center)"
        );
        spotKeys.push(key);
      }
    );

    //Stores listing information for spaces within the query
    let listings = [];

    this.state.listings = [];

    //Retrieves spots from firebase and adds them to the listings[] if their spotId is in spotKeys[]
    let dataSnapshot = database.ref("Spots");
    dataSnapshot.once('value').then((parent) => {
      parent.forEach((child) => {
        console.log("7");
        let childData = child.val();
        if (spotKeys.includes(child.key)) {
          console.log("8");
          let available = SpaceAvailabilityCheck(
            child.child("availability").val(),
            startDate,
            endDate
          );
          var reserved = false;



          //may put this in its own file to check upcoming bookings but having trouble doing it within another query
           /*dbRef.child(child.key).on('value', (snapshot) => {
            if (snapshot.exists()) {
                console.log(snapshot.val());
                upcoming = snapshot.val();

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
          });*/
        
          //var spotId = childData["spotId"];
          //reserved = await CheckIfAlreadyReserved(spotId, startDate, endDate);
          let verified = childData["address_is_verified"];
          if (available === true && verified === true && reserved === false) {
            console.log(`spot ${childData["spotId"]} is being added to list for reserved ${reserved}`);
            listings.push(childData);
          }
          console.log(available);
        
        }
      
      });
      this.setState({
        listings: listings,
      });
      //this.showProperSpots(listings);
    });
  }

  //Need to fix this to make it async with getListings()
  showProperSpots = (listings) => {
    let startDate = this.props.startDate;
    let endDate = this.props.endDate;
    let dbRef = firebase.database().ref("Upcoming_Bookings");
    var realListings = [];
    for(var i = 0; i < listings.length; i++)
    var spotId = listings[i].spotId;
    dbRef.child(spotId).on('value', (snapshot) => {
      if (snapshot.exists()) {
          

          snapshot.forEach((child) => {
            let bookingStart = new Date(child.child("startTime").val());
            let bookingEnd = new Date(child.child("endTime").val());
            let range = moment.range(bookingStart, bookingEnd);
            console.log(range);
            if(range.contains(startDate) || range.contains(endDate)) {
                //reserved = true;
                return true;
            } else {
              realListings.push(listings[i]);
              //reserved = false;
            }
          })
      } else {
        realListings.push(listings[i]);  
        //reserved = false;
      }
      this.setState({
        listings: realListings,
      });
    });
  }
  

  componentDidMount() {
    console.log("9");
    // this is a react thing that runs before component is rendered
    // that way it pulls the data first and then renders
    this.getListings(0);
  }

  render() {
    console.log("1");
    /* if (this.state.listings.length === 0) {
      console.log("3");
      return null;
    }*/
    console.log("4");
    const { tabValue } = this.state;
    const { classes } = this.props;
    const handleTabsChange = (event, newValue) => {
      this.setState({ tabValue: newValue });
    };

    return (
      <div style={{ marginBlockStart: "10px", height: "100%" }}>
        <Drawer
          className={classes.listings}
          variant="persistent"
          anchor="left"
          open
          classes={{
            paper: classes.listingsPaper,
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabsChange}
            variant="fullWidth"
            indicatorColor="primary"
            aria-label="BEST MATCH"
            className={classes.tabs}
          >
            <Tab label="BEST MATCH" {...a11yProps(0)} className={classes.tab} />
            <Tab label="CHEAPEST" {...a11yProps(1)} className={classes.tab} />
            <Tab label="CLOSEST" {...a11yProps(2)} className={classes.tab} />
          </Tabs>
          <TabPanel value={tabValue} index={0} >
            <ListingsContainer
              listings={this.state.listings}
              timeDelta={this.props.timeDelta}
              startDate={this.props.startDate}
              endDate={this.props.endDate}
              chosenLocation={this.props.chosenLocation}
            ></ListingsContainer>
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            Cheapest Locations
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            Closest Locations
          </TabPanel>
        </Drawer>

        <div className={classes.listingsMobile}>
          <div style={{display: 'flex', flexDirection: 'row', position: 'absolute', left: 0, bottom: 110}}>
            {this.state.listings.map((item, index)=> <div>
              Hey {index}
            </div>)}
          </div>
        </div>

        <div className={classes.mapArea}>
          <Map
            chosenLocation={this.props.chosenLocation}
            listings={this.state.listings}
            timeDelta={this.props.timeDelta}
          ></Map>
        </div>
      </div>
    );
  }
}

function a11yProps(index) {
  return {
    id: `listings-tab-${index}`,
    "aria-controls": `listings-tabpanel-${index}`,
  };
}

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`listings-tabpanel-${index}`}
      aria-labelledby={`listings-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

export default withStyles(styles)(ListingExplorer);