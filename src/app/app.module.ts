import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { OsdViewerComponent } from './osd-viewer/osd-viewer.component';

@NgModule({
  declarations: [AppComponent, OsdViewerComponent],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
