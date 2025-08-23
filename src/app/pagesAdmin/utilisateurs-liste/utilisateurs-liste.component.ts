import { Utilisateur } from './../../models/model-user';
import { UserService,  } from 'src/app/services/user.service';
import { Component, OnInit } from '@angular/core';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-utilisateurs-liste',
  templateUrl: './utilisateurs-liste.component.html',
  styleUrls: ['./utilisateurs-liste.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class UtilisateursListeComponent  implements OnInit {

     utilisateurs$!: Observable<Utilisateur[]>;
  connectes$!: Observable<number>;

  constructor(private firestore: Firestore,
              private userService : UserService
  ) {}

  ngOnInit(): void {
     this.utilisateurs$ = this.userService.getUtilisateursAvecStatut();
  this.connectes$ = this.userService.getUtilisateursConnectes();
  }

}
