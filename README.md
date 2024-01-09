# OsdVisitedTilesPoc

[![Netlify Status](https://api.netlify.com/api/v1/badges/2dfa6399-f822-44b6-9ff5-5626fa4226ff/deploy-status)](https://app.netlify.com/sites/osd-visited-tiles-poc/deploys)

This Proof of Concept demonstrates the ability to track and visualize the tiles visited in an OpenSeadragon viewer as colored overlays in the viewer navigator.

## Grid Based Tracking

The viewer navigator is divided into a grid of cells. Cells viewed by the user are tracked. Each cell is identified by its coordinates. When a cell is viewed for the first time, an overlay is added to the cell and stored in the `viewedCells` set and `overlays` map.

## Opacity Proportional to Zoom

The opacity of a grid cell is set according to the current zoom level. It's calculated as a proportion of the current zoom level to the maximum zoom level. If a cell is visited again at a higher zoom, the opacity of the cell is updated to reflect the higher value.

## Debouncing

`zoom` and `pan` events are handled after a period of inactivity, reducing the number of times the event handler is called.

## Persistence in localStorage

Viewed cells and their overlays are stored in localStorage. This allows the application to remember viewed cells even after a page refresh.

**TODO:** In the Labelson implementation, remove data from localStorage when opening a new slide
