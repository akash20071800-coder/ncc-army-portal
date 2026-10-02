// Frontend-to-backend integration
// This module connects the existing frontend app.js to the production backend API

import api from './api.js';

export async function initApp() {
  // Check if user is already logged in
  const token = localStorage.getItem('ncc_token');
  if (token) {
    api.setToken(token);
  }
}

export async function loginUser(user, password, regNo = null, name = null) {
  try {
    const response = await api.login(user, password, regNo, name);
    if (response?.token && response?.user) {
      api.setToken(response.token);
      return response.user;
    }
    throw new Error('Invalid credentials');
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export async function logoutUser() {
  api.clearToken();
}

export async function fetchDashboard() {
  return api.getDashboard();
}

export async function fetchSettings() {
  const response = await api.getSettings();
  return response?.settings || {};
}

export async function saveSettings(settings) {
  return api.updateSettings(settings);
}

export async function fetchCadets() {
  const response = await api.getCadets();
  return response?.cadets || [];
}

export async function createCadet(cadet) {
  const response = await api.createCadet(cadet);
  return response?.cadet;
}

export async function updateCadet(id, cadet) {
  const response = await api.updateCadet(id, cadet);
  return response?.cadet;
}

export async function deleteCadet(id) {
  return api.deleteCadet(id);
}

export async function fetchNRs() {
  const response = await api.getNRs();
  return response?.nrs || [];
}

export async function createNR(nr) {
  const response = await api.createNR(nr);
  return response?.nr;
}

export async function fetchLetters() {
  const response = await api.getLetters();
  return response?.letters || [];
}

export async function createLetter(letter) {
  const response = await api.createLetter(letter);
  return response?.letter;
}

export async function fetchAttendance() {
  const response = await api.getAttendance();
  return response?.attendance || [];
}

export async function createAttendance(attendance) {
  const response = await api.createAttendance(attendance);
  return response?.attendance;
}

export async function fetchVolunteer() {
  const response = await api.getVolunteer();
  return response?.volunteer || [];
}

export async function createVolunteer(volunteer) {
  const response = await api.createVolunteer(volunteer);
  return response?.volunteer;
}

export async function fetchFinance() {
  const response = await api.getFinance();
  return response?.finance || [];
}

export async function createFinance(finance) {
  const response = await api.createFinance(finance);
  return response?.finance;
}

export async function fetchDrive() {
  const response = await api.getDrive();
  return response?.drive || [];
}

export async function createDriveItem(item) {
  const response = await api.createDriveItem(item);
  return response?.drive;
}

export async function fetchActivity() {
  const response = await api.getActivity();
  return response?.activity || [];
}

export async function fetchUsers() {
  const response = await api.getUsers();
  return response?.users || [];
}

export async function deleteUser(id) {
  return api.deleteUser(id);
}

export async function exportBackup() {
  return api.getBackup();
}

export async function importBackup(backup) {
  return api.importSettings(backup);
}

export async function resetDemoData() {
  return api.resetDemo();
}
