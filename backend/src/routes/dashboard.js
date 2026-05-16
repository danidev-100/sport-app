const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/metricas', dashboardController.getMetricas);
router.get('/cuotas-grafico', dashboardController.getCuotasGrafico);
router.get('/recientes', dashboardController.getRecientes);
router.get('/morosos', dashboardController.getMorosos);
router.get('/ingresos-mensuales', dashboardController.getIngresosMensuales);

module.exports = router;