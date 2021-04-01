import '../../node_modules/leaflet/dist/leaflet.css';
import L from 'leaflet';
import HslToHex from './hslToHex';
import markerImage  from 'url:../../node_modules/leaflet/dist/images/marker-icon-2x.png';
import markerShadow  from 'url:../../node_modules/leaflet/dist/images/marker-shadow.png';


class MyMap {
  constructor() {

    this.createMap();
    this.getData();
    this.createInfoPopup();
    this.createLegend();
    this.getLocation();
  }

  createIcon() {
    let basicMarker = new L.Icon({
      iconUrl: markerImage,
      shadowUrl: markerShadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    return basicMarker;
  }

  createLegend(){

    //Legend color 
    let legendColor = L.control({position: 'bottomright'});
    legendColor.onAdd = () => {
      let div = L.DomUtil.create('ul', 'info legend right');
      let grades = [0, 50, 100, 150, 200];

      // loop through our density intervals and generate a label with a colored square for each interval
      for (let i = 0; i < grades.length; i++) {
        div.innerHTML +=
          `<li>
            <i style="background: ${this._getColor( i / grades.length )} "></i>
            <span>${grades[i] + (grades[i + 1] ? ` &ndash; ${grades[i + 1]}` : '+')}<span>
          </li>`;
      }

      return div;
    };
    
    //Legend size
    let legendSize = L.control({position: 'bottomleft'});
    legendSize.onAdd = () => {
      let div = L.DomUtil.create('ul', 'info legend left');
      
      for (let i = 0; i < 4; i++) {
        let nbOfPlaces = (i + 1) * 400;
        let width = this._getRadius( nbOfPlaces );
        div.innerHTML += `<li><i style="width: ${width}px; height: ${width}px "></i> <span>${nbOfPlaces}</span> </li>`;
      }
      return div;
    }
    
    //add legends to map
    legendColor.addTo(this.map);
    legendSize.addTo(this.map);

  }

  createMap() {
    this.map = L.map('map').setView([44.837789, -0.57918], 12);
    
    L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    }).addTo(this.map);
  }

  createInfoPopup() {
    this.info = L.control();

    this.info.onAdd = () => {
        this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
        this.info.update();
        return this._div;
    };
    
    // method that we will use to update the control based on feature properties passed
    this.info.update = (props) => {
      this._div.innerHTML = '<h4>Parking Information</h4>' +  (props ? 
        `<p class="name"> ${props.nom} </p> 
          <p> ${props.libres} places restantes</p>
          <p> ${props.total} places totales</p>
          <p> ${ (props.th_24 != null) ? `<p> ${props.th_24.toFixed(2)}€ 24h` : 'Pas de données sur le tarif'}</p>`
  
        : 'Survole un parking');
    };
    
    this.info.addTo(this.map);
  }

  getData() {
    let query = 'https://opendata.bordeaux-metropole.fr/api/v2/catalog/datasets/st_park_p/records?limit=86&timezone=UTC&order_by=libres desc';
     
    fetch(query).then( response => {
      response.json().then( json => {
        this.fillMapWithData(json.records);
      })
    })
  }

  fillMapWithData(parksData) {
    parksData.forEach( park => {

      if (park.record.fields.total) {
        let color = this._getColor(park.record.fields.libres / park.record.fields.total);
        let radius = this._getRadius(park.record.fields.total);
        
        let circleMarker = L.circleMarker(park.record.fields.geo_point_2d, {
          color: color,
          fillColor: color,
          fillOpacity: 0.8,
          weight: 0,
          radius: radius,
        }).addTo(this.map);
    
        //ACTIONS
        circleMarker.on('click', (e) => {
          this.map.flyTo(e.target.getLatLng(), 15); 
        })
    
        circleMarker.on('mouseover', (e) => {
          let layer = e.target;
          layer.setStyle({
            weight: 3,
            color: 'white'
          })
  
          this.info.update(park.record.fields);
        });
    
        circleMarker.on('mouseout', (e) => {
          let layer = e.target;
          layer.setStyle({
            weight: 0,
            color: 'white'
          })
        });
      }
    });
  }

  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition( (ev) => {
        let coord = [ev.coords.latitude, ev.coords.longitude] 
        L.marker(coord, {icon: this.createIcon() } ).addTo(this.map);
      });
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }

  _getColor(libresAmount) {
    let h = libresAmount * 121;
    return HslToHex(h, 100, 40)
  }
  
  _getRadius(total) {
    return ( total / 40 ) + 10;
    //return Math.min(total / 15, 50);
  } 
}

new MyMap;