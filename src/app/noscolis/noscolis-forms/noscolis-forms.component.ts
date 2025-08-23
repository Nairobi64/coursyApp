import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Router, RouterModule } from '@angular/router';



@Component({
  selector: 'app-noscolis-forms',
  templateUrl: './noscolis-forms.component.html',
  styleUrls: ['./noscolis-forms.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule, RouterModule]
})
export class NoscolisFormsComponent implements OnInit {

   colisForm = this.fb.group({
    expediteurNom: ['', Validators.required],
    expediteurTel: ['', [Validators.required, Validators.pattern(/^[0-9]{9,}$/)]],
    expediteurAdresse: ['', Validators.required],

    destinataireNom: ['', Validators.required],
    destinataireTel: ['', [Validators.required, Validators.pattern(/^[0-9]{9,}$/)]],
    destinataireAdresse: ['', Validators.required],

    description: ['', Validators.required],
    poids: ['', Validators.required],
    valeur: [''] // optionnel
  });

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private auth: Auth,
    private router: Router,
    private toastCtrl: ToastController
  ) {}


  ngOnInit() {}

  private generateTrackingNumber(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) { // 12 caractères après SN
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'SN' + code;
  }

  async onSubmit() {
    if (!this.colisForm.valid) return;

    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      const toast = await this.toastCtrl.create({
        message: 'Vous devez être connecté pour enregistrer un colis.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    const trackingNumber = this.generateTrackingNumber();

    const colisData = {
      ...this.colisForm.value,
      statut: 'en_attente',
      dateCreation: new Date(),
      trackingNumber,
      client: { uid: currentUser.uid }
    };

    try {
      const colisRef = collection(this.firestore, 'colis');
      await addDoc(colisRef, colisData);

      const toast = await this.toastCtrl.create({
        message: `Colis enregistré ! Numéro de suivi : ${trackingNumber}`,
        duration: 3000,
        color: 'success'
      });
      await toast.present();

      this.colisForm.reset();
      this.router.navigate(['/user/suivi']); // redirection vers page suivi
    } catch (err) {
      console.error('Erreur lors de la sauvegarde', err);
      const toast = await this.toastCtrl.create({
        message: 'Erreur lors de l’enregistrement du colis.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }
}
