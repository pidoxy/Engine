"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { patientService } from '../lib/services';
import { useRouter } from 'next/navigation';
import { FiUsers, FiPlus, FiUserPlus, FiClipboard, FiLogOut } from 'react-icons/fi';
// ... rest of the code from dashboard/chw/page.jsx ... 