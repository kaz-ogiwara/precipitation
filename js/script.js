const LAT = 36.8;
const LNG = 137.7;
let data = null;
let gCurrentObjectIndex;

const DESCRIPTIONS = [
  {
    "dates": "default",
    "class": "default"
  }, {
    "dates": "2019/06/30,2019/07/01,2019/07/02,2019/07/03,2019/07/04",
    "class": "d01",
  }, {
    "dates": "2019/08/14,2019/08/15,2019/08/16",
    "class": "d02",
  }, {
    "dates": "2019/08/27,2019/08/28",
    "class": "d03",
  }, {
    "dates": "2019/09/08,2019/09/09",
    "class": "d04",
  }, {
    "dates": "2019/10/11,2019/10/12,2019/10/13",
    "class": "d05",
  }, {
    "dates": "2019/10/25,2019/10/26",
    "class": "d06",
  }
];

const deckgl = new deck.DeckGL({
  mapboxApiAccessToken: 'pk.eyJ1IjoidGtwZmFkbWluIiwiYSI6ImNqbjJ2c2pkazMzcnAzcW84d3dpbjR2NmQifQ.dxPtzKHbhxypqtj7aZ9E2w',
  mapStyle: {
    version: 8,
    sources: {
      "gsi-tiles": {
        type: "raster",
        tiles: ["https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg"],
        attribution: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
        tileSize: 256
      }
    },
    layers: [
      {
        id: "simple-tiles",
        type: "raster",
        source: "gsi-tiles",
        minzoom: 0,
        maxzoom: 22
      }
    ]
  },
  container: 'map-block',
  longitude: LNG,
  latitude: LAT,
  zoom: 5,
  minZoom: 3,
  maxZoom: 8,
  pitch: 50,
  bearing: 10,
  lang: "ja"
});

const rotateViewport = (direction) => {

  const MIN_PITCH = 0;
  const MAX_PITCH = 60;

  // Get current viewState
  let cState = deckgl.controller.props.viewState;

  // Change viewState value depending on the direction
  if (direction === "right") cState.bearing -= 9;
  if (direction === "left")  cState.bearing += 9;
  if (direction === "up")    cState.pitch   -= 6;
  if (direction === "down")  cState.pitch   += 6;

  if (cState.pitch < MIN_PITCH) cState.pitch = MIN_PITCH;
  if (cState.pitch > MAX_PITCH) cState.pitch = MAX_PITCH;

  // Update viewState
  deckgl.setProps({
    viewState: {
      longitude: cState.longitude,
      latitude: cState.latitude,
      zoom: cState.zoom,
      minZoom: cState.minZoom,
      maxZoom: cState.maxZoom,
      pitch: cState.pitch,
      bearing: cState.bearing
    }
  });
}

const getRGB = (hex) => {
  hex = hex.slice(1);
  if (hex.length == 3) hex = hex.slice(0,1) + hex.slice(0,1) + hex.slice(1,2) + hex.slice(1,2) + hex.slice(2,3) + hex.slice(2,3);
  return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map(function(str) {
    return parseInt( str, 16 ) ;
  });
}

const colors = [
  getRGB("#ddd"),
  getRGB("#acf"),
  getRGB("#79c"),
  getRGB("#469"),
  getRGB("#136"),
  getRGB("#862"),
  getRGB("#821")
];

const renderLayer = () => {
  const addChart = (points) => {
    $("#tooltip-chart").html('<canvas id="chart-canvas"></canvas>');

    let dates = [];
    let dt = new Date(2018, 11, 25);
    for (let i = 0; i < 365; i++) {
      dt.setDate(dt.getDate() + 1);

      if (dt.getDate() === 1) {
        let dtstr = (dt.getMonth() + 1).toString() + "月";
        dates.push(dtstr);
      } else {
        dates.push("");
      }
    }

    let colors = [
      "#8ad",
      "#dfe"
    ];

    let config = {
    	type: "line",
    	data: {
  			labels: dates,
  			datasets: []
  		},
    	options: {
        aspectRatio: 1.0,
        responsive: true,
        legend: {
          display: false
        },
        title: {
    			display: false
    		},
        tooltips: {
          mode: 'index',
          xPadding: 24,
          yPadding: 12,
          displayColors: true,
          yAlign: 'bottom',
          callbacks: {
            title: function(tooltipItem){
              let dt = new Date(2019, 0, 1);
              dt.setDate(dt.getDate() + tooltipItem[0].index);
              let dtstr = dt.getFullYear() + "/" + ("0" + (dt.getMonth() + 1).toString()).slice(-2) + "/" + ("0" + dt.getDate()).slice(-2);

              let ret = dtstr;
              return ret;
            },
            label: function(tooltipItem, data){
              let ret = data.datasets[tooltipItem.datasetIndex].label + "：降水量" + tooltipItem.value + " mm/日";
              return ret;
            }
          }
        },
    		scales: {
    			xAxes: [{
            display: false,
            gridLines: {
              display: false
            }
    			}],
    			yAxes: [{
            location: "bottom",
            gridLines: {
              display: true,
              color: "rgba(255, 255, 255, 0.3)"
            },
            ticks: {
              suggestedMax: 1000,
              suggestedMin: 0,
              callback: function(value, index, values) {
                if (value % 200 === 0) {
                  return value.toString() + " mm";
                }
              }
            }
    			}]
    		}
    	}
    };

    points.forEach(function(point, index){
      let dataset = {
        label: point[3],
        backgroundColor: colors[index],
        pointRadius: 1,
        borderWidth: 1,
        borderColor: colors[index],
        data: point[4].split("/")
      };

      config.data.datasets.push(dataset);
    });

    // Show legend when the chart has multiple points
    if (points.length >= 2) config.options.legend.display = true;

    let ctx = document.getElementById("chart-canvas").getContext('2d');
    Chart.defaults.global.defaultFontColor = "rgba(255, 255, 255, 0.8)";
    window.myChart = new Chart(ctx, config);
  }

  const showTooltip = ({x,y,object}) => {
    if (object) {
      let $tooltip = $("#description-modal").find("section.tooltip");

      $tooltip.find("table").find("tbody").empty();
      $tooltip.find("#tooltip-chart").empty();
      gCurrentObjectIndex = object.index;
      points = [];

      object.points.forEach(function(point){
        points.push(point);
        let number = point[2];
        let name = point[3];
        let prec = point[4].split("/")[getCurrentDateIndex()];
        let html =  '<tr>'
                    + '<td>' + name + '</td>'
                    + '<td>' + $("#date-box").text() + '</td>'
                    + '<td>' + prec + '<span> mm</span></td>'
                  + '</tr>';

        $tooltip.find("table").find("tbody").append(html);
      });

      addChart(points);

      $("#description-modal").find("section").removeClass("show");
      $("#description-modal").find("section.tooltip").addClass("show");
      $("#description-modal").addClass("show");
    } else {
      $("#description-modal").removeClass("show");
      gCurrentObjectIndex = -1;
    }
  }

  const getCurrentDateIndex = () => {
    let dates = $("#date-box").text().split("/");
    let dt = new Date(2019, parseInt(dates[1]) - 1, parseInt(dates[2]));
    let min_dt = new Date(2019,  0,  1); // 2019.01.01

    return (dt - min_dt) / 86400000;
  }

  const getAverage = (d) => {
    let ret = 0;
    let num = 0;

    for (let j = 0; j < d.length; j++){
      let days = d[j][4].split("/");
      let cdi = getCurrentDateIndex();
      if (days[cdi]) {
        if (!isNaN(days[cdi])) {
          if (parseFloat(days[cdi]) >= 0) {
            ret += parseFloat(days[cdi]);
            num += 1;
          }
        }
      }
    }

    if (num >= 2) ret = ret / num;

    return ret;
  }

  const getColorLevel = (d) => {
    let avg = getAverage(d);
    let level = 0;
    if (  1 <= avg) level = 1;
    if (  5 <= avg) level = 2;
    if ( 10 <= avg) level = 3;
    if ( 50 <= avg) level = 4;
    if (100 <= avg) level = 5;
    if (200 <= avg) level = 6;
    return level;
  }

  const LIGHT_SETTINGS = {
    lightsPosition: [LNG + 2, LAT - 2, 2000, LNG - 2, LAT + 2, 2000],
    ambientRatio: 0.4,
    diffuseRatio: 0.6,
    specularRatio: 0.2,
    lightsStrength: [1.3, 0.4, 1.3, 0.4],
    numberOfLights: 2
  };

  const hexagonLayer = new deck.HexagonLayer({
    id: 'hexagonLayer',
    data,
    colorRange: colors,
    colorDomain: [0, 6],
    getColorValue: d => getColorLevel(d),
    elevationScale: 300,
    elevationDomain: [0, 922.5],
    getElevationValue: d => getAverage(d),
    extruded: true,
    getPosition: d => d,
    autoHighlight: true,
    highlightColor: [240,220,0,230],
    lightSettings: LIGHT_SETTINGS,
    opacity: 1,
    radius: 6000,
    coverage: 1,
    pickable: true,
    onClick: showTooltip,
    upperPercentile: 100
  });

  deckgl.setProps({
    layers: [hexagonLayer]
  });
}

const updateDescription = () => {
  let descClass = "default";

  DESCRIPTIONS.forEach(function(desc){
    let dates = desc.dates.split(",");
    dates.forEach(function(date){
      if ($("#date-box").text() == date) {
        descClass = desc["class"];
      }
    });
  });

  $("#description-modal").find("section").removeClass("show");
  $("#description-modal").find("section." + descClass).addClass("show");

  if (descClass === "default") {
    $("#description-button").removeClass("show");
  } else {
    $("#description-button").addClass("show");
  }
}

const init = () => {
  const loadData = () => {
    d3.csv("data/data.csv", (error, response) => {
      data = response.map(function(d) {
        return [
          Number(d.longitude),
          Number(d.latitude),
          String(d.number),
          String(d.name),
          String(d.values)
        ];
      });

      renderLayer();
      $("#map-cover").removeClass("show");
    });
  }

  const moveIndex = (type, duration) => {
    let dates = $("#date-box").text().split("/");
    let dt = new Date(2019, parseInt(dates[1]) - 1, parseInt(dates[2]));
    let min_dt = new Date(2019,  0,  1); // 2019.01.01
    let max_dt = new Date(2019, 11, 25); // 2019.12.25

    if (type === "next" && duration === "day")   dt.setDate(dt.getDate() + 1);
    if (type === "prev" && duration === "day")   dt.setDate(dt.getDate() - 1);
    if (type === "next" && duration === "month") dt.setMonth(dt.getMonth() + 1);
    if (type === "prev" && duration === "month") dt.setMonth(dt.getMonth() - 1);

    $(".input-date-button").addClass("clickable");

    if (dt <= min_dt) {
      dt = min_dt;
      $(".input-date-button.prev").removeClass("clickable");
    }

    if (dt >= max_dt) {
      dt = max_dt;
      $(".input-date-button.next").removeClass("clickable");
    }

    let dtstr = dt.getFullYear() + "/" + ("0" + (dt.getMonth() + 1).toString()).slice(-2) + "/" + ("0" + dt.getDate()).slice(-2);
    $("#date-box").text(dtstr);

    updateDescription();
    renderLayer();
  }

  const bindEvents = () => {
    // When show map button was clicked
    $("#show-map").on("click",function(){
      $("#cover-block").addClass("hide");
    });

    // When certain disaster in article block was clicked
    $(".row-disaster").on("click", function(){
      $("#date-box").text($(this).attr("date"));
      updateDescription();
      renderLayer();
      let cState = deckgl.controller.props.viewState;
      deckgl.setProps({
        viewState: {
          longitude: parseInt($(this).attr("lon")),
          latitude: parseInt($(this).attr("lat")),
          zoom: cState.zoom,
          minZoom: cState.minZoom,
          maxZoom: cState.maxZoom,
          pitch: cState.pitch,
          bearing: cState.bearing
        }
      });
      $("#description-modal").removeClass("show");
    });

    // When rotation button (top left) was clicked
    $("#rotate-buttons").find("button").on("click",function(){
      let type = $(this).attr("type");
      rotateViewport(type);
    });

    // When description button (bottom right) was clicked
    $("#description-button").on("click", function(){
      updateDescription("");
      $("#description-modal").addClass("show");
    });

    // When description cover was clicked
    $("#description-modal").find(".cover").on("click", function(){
      $("#description-modal").removeClass("show");
    });

    // When description close button was clicked
    $("#description-modal").find(".close").on("click", function(){
      $("#description-modal").removeClass("show");
    });

    // When side buttons were clicked
    $(".input-date-button.clickable").on("click", function(){
      if ($(this).hasClass("next")) {
        if ($(this).hasClass("month")) moveIndex("next", "month");
        if ($(this).hasClass("day"))   moveIndex("next", "day");
      }

      if ($(this).hasClass("prev")) {
        if ($(this).hasClass("month")) moveIndex("prev", "month");
        if ($(this).hasClass("day"))   moveIndex("prev", "day");
      }
    });
  }

  loadData();
  bindEvents();
};


$(function(){
  init();
});
