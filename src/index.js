import React from 'react';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css';
import bus_list from './bus_list.json'
import { bbox } from '@turf/turf'
import gradient from './gradient.png';
import './styles.css';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2FhZGlxbSIsImEiOiJjamJpMXcxa3AyMG9zMzNyNmdxNDlneGRvIn0.wjlI8r1S_-xxtq2d-W5qPA';

let steps = [
  [0.3, '#660066'],
  [0.6, '#493e75'],
  [0.9, '#63a3e2'],
  [0.92, '#76d3f2'],
  [0.96, '#88dffc'],
  [0.98, '#a8e9ff'],
  [1.0, '#baeafc']
]

class Application extends React.Component {

  constructor(props) {
    super(props);
    this.handle_bus = this.handle_bus.bind(this)
    this.state = {
      lng: -113.953317,
      lat: 50.893225,
      zoom: 12.5,
      buses:bus_list,
      selected_bus: 468,
      height:props.height,
      width: props.width
    };
  }

  componentWillMount(){
    this.setState({height: window.innerHeight,width:window.innerWidth});
  }

  componentDidMount() {

    const {lng, lat, zoom } = this.state;
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/saadiqm/cjbjougmt08z72rsa7me1duoi',
      center: [lng, lat],
      zoom
    });

    this.map.on('load', () => {
      let bus_route = 'https://e9tfys5j6f.execute-api.us-west-2.amazonaws.com/busroutes/api/bus/'+this.state.selected_bus
      let closeness = 'https://e9tfys5j6f.execute-api.us-west-2.amazonaws.com/busroutes/api/closeness/'+this.state.selected_bus

      var layers = this.map.getStyle().layers;
    // Find the index of the first symbol layer in the map style
      var firstSymbolId;
      for (var i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol') {
            firstSymbolId = layers[i].id;
            break;
        }
      }

      this.map.addSource('Closeness', {
        type: 'geojson',
        data: closeness
      });
      this.map.addSource('Bus Route', {
        type: 'geojson',
        data: bus_route
      });
      this.map.addLayer({
          "id": "Closeness",
          "type": "line",
          "source": 'Closeness',
          "paint": {
              "line-color": {
                property:"closeness_centrality",
                stops: steps
              },
              "line-width": 4,
              "line-opacity":0.8
          },
          "layout": {
              "line-join": "round",
              "line-cap": "round"
          },
      },firstSymbolId);
      this.map.addLayer({
          "id": "Bus Route",
          "type": "line",
          "source": 'Bus Route',
          "paint": {
              "line-color": "#f4e842",
              "line-width": 5,
          },
          "layout": {
              "line-join": "round",
              "line-cap": "round"
          },
      },firstSymbolId);
    });
  }

  handle_bus(e){
    e.preventDefault();
    let selection = e.target.value;
    let pad = {}
    if (this.state.width<500){
      pad ={top:this.state.height*0.3, bottom: 5, left:5, right:5};
    } else {
      pad ={top:this.state.height*0.1, bottom:this.state.height*0.1, left:this.state.width*0.3, right:this.state.height*0.1};
    }

    this.setState({selected_bus: selection}, () => {
      let bus = 'https://e9tfys5j6f.execute-api.us-west-2.amazonaws.com/busroutes/api/bus/'+this.state.selected_bus
      let closeness = 'https://e9tfys5j6f.execute-api.us-west-2.amazonaws.com/busroutes/api/closeness/'+this.state.selected_bus

      fetch(bus)
        .then(response => {
            return response.json();
        }).then(data => {
            let bounds= bbox(data); //find bounding box using Turf
            this.map.fitBounds(bounds, {
              padding: {top: pad.top, bottom:pad.bottom, left: pad.left, right: pad.right}
            });
        });

      this.map.getSource('Bus Route').setData(bus);
      this.map.getSource('Closeness').setData(closeness);

    });
  }

  render() {

    let bus_routes = this.state.buses;
    let optionItems = bus_routes.map((bus) => <option key={bus.route_short_name} value={bus.route_short_name}>{bus.route_short_name+" - "+bus.route_long_name}</option>);

    return (
      <div>
        <div ref={el => this.mapContainer = el} className="absolute top right left bottom" />
        <div className="border_box">

          <h1>Calgary Transit Bus Routes</h1>
          <h2>Closeness Centrality Index </h2><h4>(Beta)</h4>

          <select onChange={this.handle_bus} value={this.state.value} className="select_option">
            {optionItems}
          </select>

          <img src={gradient} alt="gradient" style={{marginTop:"20px"}} />

            <div id="textbox">
              <p className="alignleft">High Closeness</p>
              <p className="alignright">Low Closeness</p>
            </div>
            <div style={{clear: "both"}}></div>
            <p className="description"><strong>Closeness Centratliy</strong> measures the closeness of a street to other streets. The higher the closeness centraltiy the more central the street.</p>

            <h4><a href="https://www.nodalscapes.com">www.nodalscapes.com</a></h4>
        </div>

      </div>
    );
  }
}
ReactDOM.render(<Application />, document.getElementById('root'));
