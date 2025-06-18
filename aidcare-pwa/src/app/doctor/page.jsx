"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { patientService, organizationService } from '../lib/services';
import { useRouter } from 'next/navigation';
// ... rest of the code from dashboard/doctor/page.jsx ... 