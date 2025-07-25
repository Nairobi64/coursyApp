import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';


@Component({
  selector: 'app-modif-infos-driver',
  templateUrl: './modif-infos-driver.component.html',
  styleUrls: ['./modif-infos-driver.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
})
export class ModifInfosDriverComponent  implements OnInit {

  driverId: string = '';
  driver: any = {};

  constructor(private firestore: Firestore, private auth: Auth) {}

  ngOnInit() {}

  async updateProfile() {
  const driverRef = doc(this.firestore, 'chauffeurs', this.driverId);
  await updateDoc(driverRef, {
    prenom: this.driver.prenom,
    nom: this.driver.nom,
    telephone: this.driver.telephone
  });
}


}
