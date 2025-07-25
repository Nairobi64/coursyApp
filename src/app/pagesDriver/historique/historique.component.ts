import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';




@Component({
  selector: 'app-historique',
  templateUrl: './historique.component.html',
  styleUrls: ['./historique.component.scss'],
  standalone:true,
  imports : [IonicModule, CommonModule, FormsModule]
})
export class HistoriqueComponent  implements OnInit {

  courses: any[] = [];
filteredCourses: any[] = [];
filter = 'tous';

  constructor() { }

  ngOnInit() {}

  applyFilter() {
  if (this.filter === 'tous') {
    this.filteredCourses = this.courses;
  } else {
    this.filteredCourses = this.courses.filter(c => c.status === this.filter);
  }
}

}
