![hermes-reversed logo](/assets/rtmhr_logo.png)

---
![visitors](https://visitor-badge.laobi.icu/badge?page_id=Azkun.hermes-reversed) 
![stars](https://img.shields.io/github/stars/Azkun/hermes-reversed)

*Le but de ce repo est de rendre accessible l'utilisation de l'**API Hermes** de la **Régie des transports Métropolitains**, la régie s'occupant des transports à Marseille. Je n'aime pas particulièrement les transports de ma ville mais en faisant de la **rétro-ingénierie**, j'ai remarqué des choix dans l'infrastructure qui sont plutôt intéressants. Le nom **Hermes** a été choisi par sa présence sur plusieurs **endpoints**.*

**Le repo se divise en deux parties :**
- Une documentation non-exhaustive des endpoints de l'**API Hermes**
- Un module **Typescript** compatible pour des applications **Node.js** (via npm) et les navigateurs avec **Javascript**

> **Le module est encore en construction** : Je laisserai cette notation jusqu'à ce que je jugerai que le module est utilisable et cohérent.

---

# Sommaire
- [Documentation de l'API](#documentation-de-lapi)
- [Documentation du module](#documentation-du-module)
- [To-dos](#to-dos)
- [Contributions](#contributions)
- [Disclaimer](#Disclaimer)

# Documentation de l'API

## Observations

- Chaque **ligne** du réseau a un identifiant différent de celui connu couramment par les utilisateurs. Exemple: le bus **B1** a l'identifiant **RTM:LNE:139**.
- Pas tous les arrêts ont une description d'adresse, mais tous ont une latitude/longitude.
- La recherche pour trouver les horaires par arrêt s'est effectué linéairement afin de trouver des informations de plus en plus précises : Trouver toutes les lignes de bus et en déduire celle qu'on veut, prendre son `id` en RTM:LNE:XXX, trouver ses deux directions en RTM:RTE:XXX, puis trouver chaque arrêt chronologique de la route RTM:PNT:XXX. Finalement on peut trouver les prochains passages des bus sur l'arrêt.

## Liens absolus

Pour la suite, trois URLs absolus utilisés dans l'API seront utilisés abrégés en `front`, `fiches` et `Hermes`, les voici :

```
https://api.rtm.fr/front
```

```
https://map.rtm.fr/Hermes
```

```
https://api.rtm.fr/fiche-horaires/
```


## Endpoints généraux

*Ces endpoits ne nécessitent pas d'arguments et sont accessibles via une simple requête **GET**, ils servent à avoir des informations générales sur le réseau. Dans une application, ils peuvent être utilisés à l'initialisation par exemple*

<details>
<summary>front /getHorairesMetroTram/</summary>

Cet **endpoint** sert à connaître les heures de démarrages des **tramways** et des **métros** le jour même. *À noter que chaque bus a des horaires différentes.*

- Exemple de réponse :
```json
    {
        "status": "ok",
        "returnCode": "200",
        "data": {
            "metro": "4h50 > 00h30",
            "tram": "5h10 > 01h"
        }
    }
```
</details>

<details>
<summary>front /getLines/</summary>

-  `/getLines/bus`, `/getLines/metro`, `/getLines/tram`

Cet **endpoint** sert à connaître l'ensemble des bus/tram/metro existants ainsi que leur **identifiant**, leur **code publique** permettant de les rattacher au vrai nom du transport.

- Exemple de réponse :
```json
    {
        "data": {
            "RTM:LNE:139": {
                "name": "Castellane - Campus de Luminy",
                "id": "RTM:LNE:139",
                "Carrier": "Régie des Transports Métropolitains",
                "Operator": "RTM",
                "PublicCode": "B1",
                "TypeOfLine": "Régulière_interne",
                "VehicleType": "Autobus Articulé",
                "night": "0",
                "lepiloteId": "2101",
                "color": "#E5006B",
                "sqliType": "bus",
                "sqliSort": "11",
                "school": "0",
                "daynight": "1",
                "PdfNamePlan": "rtm_plan_b1_annee.pdf",
                "PdfNameHoraire": "rtm_horaire_b1_annee.pdf"
            },
            ...
        },
        ...,

        "returnCode": 200,
        "dateReturn": "2026-01-25T14:28:50+01:00"
    }
```
</details>

## Endpoints explicites

*Ces endpoits **nécessitent** un ou plusieurs arguments et sont accessibles via différentes requêtes, ils servent à avoir des informations précises sur une **ligne**, des **adresses**, des **arrêts** et des **horaires***

<details>
<summary>front /getAutocomplete?q=Adresse/</summary>

Cet **endpoint** sert à compléter une **string** ressemblant à une adresse afin de recevoir des adresses éligibles proches du réseau de transport. (fuzzy search) 

- Exemple de réponse : `/getAutocomplete?q=Vieux port/`
```json
    {
        "data": [
            {
            "value": "ADDRESS|43.2947,5.373676$5.373676$43.2947",
            "label": "Vieux Port, Marseille - Adresse"
            },
            {
            "value": "MAMP:AST-RTM-00002285-RTM-00002300-RTM-00003801-RTM-00003802-RTM-00003804-RTM-00003806-RTM-00004338$5.3742$43.29529",
            "label": "Métro Vieux Port, Marseille - Zone d'arrêt"
            },
            {
            "value": "MAMP:FRI-SMARS1$5.37409$43.29464",
            "label": "Marseille Vieux Port, Marseille - Zone d'arrêt"
            },
            {
            "value": "hubparking:13055_64$5.36879$43.296476",
            "label": "Vieux-Port / Hôtel de Ville, MARSEILLE - Parking"
            },
            {
            "value": "hubparking:13055_63$5.363131$43.298495",
            "label": "VIEUX PORT FORT SAINT JEAN, MARSEILLE - Parking"
            }
        ],
        "status": "ok",
        "returnCode": 200
    }
```
</details>

<details>
<summary>front /getRoutes/RTM:LNE:XXX</summary>

Cet **endpoint** sert à connaître les routes qu'un transport prend. Cela sert à connaître les terminus ainsi que l'ID du transport allant vers ce terminus. Il est nécessaire de connaître l'ID de la ligne de transport pour ça. 

- Exemple de réponse `/getRoutes/RTM:LNE:184`:
```json
    {
  "data": {
    "RTM:RTE:9000184RTMA": {
      "id": "4516",
      "refNEtex": "RTM:RTE:9000184RTMA",
      "sqlistationId": "1941",
      "sqlilineNumber": "S8",
      "pointId": "100001941",
      "lineId": "9000184RTM",
      "sqliOrdering": "12",
      "DirectionRef": "1",
      "Direction": "Aller",
      "operator": "RTM",
      "lineRef": "RTM:LNE:184",
      "DirectionStations": "Lycée Marseilleveyre",
      "DirectionStationsSqli": "Lycée Marseilleveyre"
    },
    "RTM:RTE:9000184RTMR": {
      "id": "4529",
      "refNEtex": "RTM:RTE:9000184RTMR",
      "sqlistationId": "1718",
      "sqlilineNumber": "S8",
      "pointId": "100001718",
      "lineId": "9000184RTM",
      "sqliOrdering": "13",
      "DirectionRef": "2",
      "Direction": "Retour",
      "operator": "RTM",
      "lineRef": "RTM:LNE:184",
      "DirectionStations": "Madrague de Montredon",
      "DirectionStationsSqli": "Madrague de Montredon"
    }
  },
  "meta": {
    "cacheLevel": "no cache",
    "function": " getRoutesAction line:'RTM:LNE:184' "
  },
  "returnCode": 200,
  "dateReturn": "2026-01-25T18:37:54+01:00"
}
```
</details>

<details>
<summary>front /getStations/RTM:RTE:XXX</summary>

Cet **endpoint** sert à connaître les arrêts qu'un transport défile. Chaque arrêt appelé "point" a un `StopRef`, pour l'indentifier dans la ligne. Il est obligatoire de connaître l'identifiant de route de votre ligne de transport. Le nom de chaque arrêt est également explicité

- Exemple de réponse `/getStations/RTM:RTE:900062RTMR` :
```json
{
    "data": [
        {
            "id": "6761",
            "refNEtex": "RTM:PNT:00001290",
            "sqlistationId": "1290",
            "sqlilineNumber": "18",
            "pointId": "100001290",
            "lineId": "900062RTM",
            "operator": "RTM",
            "lineRef": "RTM:LNE:62",
            "Name": "Le Bosquet",
            "Description": "",
            "StopRef": "RTM:PNT:00001290",
            "type": "ScheduledStopPoint",
            "postCode": "13011",
            "Longitude": "5.457677",
            "Latitude": "43.284969",
            "sqliLepiloteId": "1290",
            "pmr": "0",
            "code3l": "",
            "PdfNameHoraire": "rtm_horaire_18_2_001290_annee.pdf"
        },
        {
            "id": "6772",
            "refNEtex": "RTM:PNT:00001291",
            "sqlistationId": "1291",
            "sqlilineNumber": "18",
            "pointId": "100001291",
            "lineId": "900062RTM",
            "operator": "RTM",
            "lineRef": "RTM:LNE:62",
            "Name": "Les Néréïdes",
            "Description": "",
            "StopRef": "RTM:PNT:00001291",
            "type": "ScheduledStopPoint",
            "postCode": "13011",
            "Longitude": "5.459399",
            "Latitude": "43.285076",
            "sqliLepiloteId": "1291",
            "pmr": "0",
            "code3l": "",
            "PdfNameHoraire": "rtm_horaire_18_2_001291_annee.pdf"
        },
        ...
```
</details>


<details>
<summary>front /getLineInfo/lineNumber</summary>

Cet **endpoint** sert à connaître les informations d'une ligne par rapport à son identifiant courant pour les utilisateurs (parfois explicité comme "PublicCode" ou "lineNumber") 

- Exemple de réponse `/getLineInfo/18` :
```json
{
    "data": {
        "name": "Castellane - Le Bosquet",
        "id": "RTM:LNE:62",
        "Carrier": "Régie des Transports Métropolitains",
        "Operator": "RTM",
        "PublicCode": "18",
        "TypeOfLine": "Régulière_interne",
        "VehicleType": "Autobus Standard",
        "night": "0",
        "lepiloteId": "501",
        "color": "#814997",
        "sqliType": "bus",
        "sqliSort": "38",
        "school": "0",
        "daynight": "0",
        "horairePeriodType": "annee",
        "PdfNamePlan": "rtm_plan_18_annee.pdf",
        "PdfNameHoraire": "rtm_horaire_18_annee.pdf"
    },
    "meta": {
        "meta_dateCache_SearchRoutes": false,
        "meta_file_SearchRoutes": false,
        "function": " getLineAction '18' "
    },
    "returnCode": 200,
    "dateReturn": "2026-01-28T20:06:31+01:00"
}
```
</details>

<details>
<summary>Hermes /station-details-by-line?pointList=RTM:PNT:XXXXXXXX/</summary>

Cet **endpoint** sert à trouver les prochains bus qui paseront à un arrêt précis, à la date où la requête a été faite.

*/!\ J'ai théorisé `isMonitored` comme étant une information sur la position du bus. Si `true`, le bus est réel car il a une position GPS. Si `false`, le bus serait théorique, cela permettrait potentiellement à remplir les "trous" lorsque des problèmes de bus existeraient, et aucune garantie que ce bus passe réellement n'existe.*

- Exemple de réponse : `/station-details-by-line?pointList=RTM:PNT:00001291/`
```json
[
  {
    "pointRef": "RTM:PNT:00001291",
    "pointName": "Les Néréïdes",
    "connections": [
      {
        "lineRef": "RTM:LNE:62",
        "linePublicCode": "18",
        "lineColorValue": "814997",
        "operatorName": "RTM",
        "timetables": [
          {
            "departureTime": "20:05",
            "arrivalDelay": 5,
            "isMonitored": true,
            "destinationPointId": "RTM:PNT:00002532",
            "destinationPointName": "Castellane",
            "directionName": "2",
            "course": null
          }
        ]
      },
      ...
    ]
  }
]
```
</details>


<details>
<summary>fiches /file.pdf/</summary>

Cet **endpoint** renvoie un fichier pdf sur les horaires à travers le réseau. Il est possible de trouver différents noms de pdf par le biais de /getStations/ via "PdfNameHoraire".

- Exemple de réponse : `/rtm_horaire_18_2_001291_annee.pdf/`
[Le fichier PDF en question](https://api.rtm.fr/fiche-horaires/rtm_horaire_18_2_001291_annee.pdf)
</details>

# Documentation du module

### Building :

*Il se peut que vous souhaitiez **build** le projet directement*

***Ou PeUt ÊtRe quE c'Est lA SeuLe ManiEre DisPoNiblE pour L'iNstaNt???!!!***

#### Node >= 18
```
git clone https://github.com/Azkun/hermes-reversed.git
cd hermes-reversed
npm install
npm run build
```

ESM: `import * as Hermes from './dist/index.js'`

CJS: `const Hermes = require('./dist/index.cjs')`

## Usage

*Vous devez importer le module... jusqu'ici tout va bien*

### Exemples :

<details>
<summary>Usage du getLines()</summary>

*Plusieurs informations utiles peuvent être utilisées comme la couleur, le nom de la ligne explicitant ses terminus etc*
```js
import { getLines } from 'hermes-reversed'

const metro = await getLines('metro')
console.log(metro["RTM:LNE:116"])
// output: 
// {
//   name: 'La Rose - La Fourragère',
//   id: 'RTM:LNE:116',
//   Carrier: 'Régie des Transports Métropolitains',
//   Operator: 'RTM',
//   PublicCode: 'M1',
//   TypeOfLine: 'Régulière_interne',
//   VehicleType: 'Métro',
//   night: '0',
//   lepiloteId: '491',
//   color: '#009FE3',
//   sqliType: 'metro',
//   sqliSort: '1',
//   school: '0',
//   daynight: '0',
//   PdfNamePlan: 'rtm_plan_m1_annee.pdf',
//   PdfNameHoraire: 'rtm_horaire_m1_annee.pdf'
// }


```
</details>


<details>
<summary>Usage du getLineInfo()</summary>

*Plusieurs informations utiles peuvent être utilisées comme la couleur, le nom de la ligne explicitant ses terminus etc*
```js
import { getLineInfo } from 'hermes-reversed'

const m2 = await getLineInfo("M2")
console.log(m2)
// output: 
// {
//   name: 'Gèze - Sainte-Marguerite Dromel   ',
//   id: 'RTM:LNE:125',
//   Carrier: 'Régie des Transports Métropolitains',
//   Operator: 'RTM',
//   PublicCode: 'M2',
//   TypeOfLine: 'Régulière_interne',
//   VehicleType: 'Métro',
//   night: '0',
//   lepiloteId: '544',
//   color: '#E30613',
//   sqliType: 'metro',
//   sqliSort: '2',
//   school: '0',
//   daynight: '0',
//   horairePeriodType: 'annee',
//   PdfNamePlan: 'rtm_plan_m2_annee.pdf',
//   PdfNameHoraire: 'rtm_horaire_m2_annee.pdf'
// }


```
</details>

<details>
<summary>Usage du getAutocomplete()</summary>

*Peut renvoyer jusqu'à 5 adresse plausibles, avec en `value` des coordonnées (lat/long) formatée utilisable sur d'autres endpoints, et en `label` une string lisible.*
```js
import { getAutocomplete } from 'hermes-reversed'

const searchAdress = await getAutocomplete('Vieu porc')

console.log(searchAdress)
// output:
// [
//   {
//     value: 'ADDRESS|43.2947,5.373676$5.373676$43.2947',
//     label: 'Vieux Port, Marseille - Adresse'
//   },
//   {
//     value: 'MAMP:AST-RTM-00002285-RTM-00002300-RTM-00003801-RTM-00003802-RTM-00003804-RTM-00003806-RTM-00004338$5.3742$43.29529',
//     label: "Métro Vieux Port, Marseille - Zone d'arrêt"
//   },
//   {
//     value: 'hubparking:13055_94$5.367128$43.29248',
//     label: 'Vieux-Port / Criée, MARSEILLE - Parking'
//   },
//   ...
// ]
console.log(searchAdress[2].label)
etc...
```
</details>
<details>
<summary>Usage du timeSlot()</summary>
*Renvoie les horaires de début et de fin du métro et du tramway*

```js
import { timeSlot } from 'hermes-reversed'

const time = await timeSlot()
console.log(time)

// output: 
// {
//   metro: '{"start":"04:50","end":"00:30"}',
//   tram: '{"start":"05:10","end":"01:00"}'
// }
```

</details>


# To-dos

- Ajouter `station-details-by-line` dans le module
- Ajouter la méthode POST `front /getItinerary/` pour trouver un itinéraire à partir de `departure` (format adresse formatée), `keywordsdep` (format label d'adresse), `arrival` & `keywordsarr`, `optimize:"fastest"`, `datetime` & `date`, ainsi que les modes (Metro, Tramway, Bus...) dans l'API et le module
- Update des méthodes pour le QOL & Optimisations
- Trouver de nouveaux endpoints
- Upload le module sur NPM  & sur un CDN
- Commencer une webapp open-source sur le principe de l'application RTM (en plus light, sans download) avec des informations supplémentaires  

# Contributions

Les **pull requests** sont acceptés tant qu'elles restent cohérentes et fonctionnelles, surtout concernant l'ajout de nouveaux endpoints. Veillez à suivre un minimum le formattage déjà utilisé !

De plus, la recherche de nouveaux endpoints utiles est simple et complètement claire lors de l'usage du site [rtm.fr](https://www.rtm.fr/) ou bien des applications avec un proxy **MITM** comme [HTTP Toolkit](https://httptoolkit.com/android/)

# Disclaimer
> [!IMPORTANT]
> Ce projet est à but éducatif uniquement. Je ne suis pas affilié à la RTM et ce dépôt n’est ni soutenu ni approuvé par celle-ci. Tous les noms et marques appartiennent à leurs propriétaires respectifs. Je ne suis pas non plus responsable de l'usage des tiers utilisant les informations fournies sur ce dépôt. Vous pouvez me contacter pour toute demande de suppression.
