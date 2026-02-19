import Sponsor from "../models/Sponsor.js";

export const createSponsor = async (req, res) => {
  const sponsor = await Sponsor.create(req.body);
  res.status(201).json({ success: true, sponsor });
};

export const getSponsors = async (req, res) => {
  const sponsors = await Sponsor.find();
  res.json({ success: true, sponsors });
};

export const updateSponsor = async (req, res) => {
  const sponsor = await Sponsor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json({ success: true, sponsor });
};

export const deleteSponsor = async (req, res) => {
  await Sponsor.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};