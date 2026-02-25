import express from 'express';
import { createSponsor, getSponsors, updateSponsor, deleteSponsor } from '../controllers/sponsorController.js';
import { isAuthenticatedUser, authorizeRoles, blockDemoWriteAccess } from '../middlewares/auth.js';

const router = express.Router();

const isAdmin = [isAuthenticatedUser, blockDemoWriteAccess, authorizeRoles('admin')];

router.route('/admin/sponsors')
  .post(isAdmin, createSponsor)
  .get(isAdmin, getSponsors);

router.route('/sponsors/:id')
  .put(isAdmin, updateSponsor)
  .delete(isAdmin, deleteSponsor);

export default router;