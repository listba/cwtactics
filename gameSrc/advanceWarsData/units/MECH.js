new cwt.UnitSheet({
  "ID": "MECH",
  "cost": 3000,
  "range": 2,
  "movetype": "MV_MECH",
  "vision": 2,
  "fuel": 70,
  "captures": 10,
  "ammo": 3,
  "attack": {
    "main_wp": {
      "RECN": 85,
      "TNTK": 55,
      "MDTK": 15,
      "NTNK": 15,
      "WRTK": 5,
      "APCR": 75,
      "ARTY": 70,
      "RCKT": 85,
      "AAIR": 65,
      "MISS": 85,
      "PIPR": 55,
      "OOZM": 30
    },
    "sec_wp": {
      "INFT": 65,
      "MECH": 55,
      "RECN": 18,
      "TNTK": 6,
      "MDTK": 1,
      "NTNK": 1,
      "WRTK": 1,
      "APCR": 20,
      "ARTY": 32,
      "RCKT": 35,
      "AAIR": 6,
      "MISS": 35,
      "PIPR": 6,
      "OOZM": 20,
      "BCTR": 9,
      "TCTR": 35
    }
  },
  "assets": {
    "gfx": "cwt_anim/units/CWT_MECH.png",
    "pri_att_sound": "rocket.wav",
    "sec_att_sound": "mg.wav"
  }
});