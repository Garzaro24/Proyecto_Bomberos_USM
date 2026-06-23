import React, { useState, useEffect, useMemo } from 'react';
import html2pdf from 'html2pdf.js';
import { 
  Award, 
  Shield, 
  Star, 
  Plus, 
  ShieldCheck, 
  Printer, 
  CheckCircle2, 
  Briefcase, 
  X, 
  Camera, 
  Save, 
  User, 
  BookOpen, 
  Activity,
  AlertTriangle,
  Flame,
  Clock,
  Car,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { HumanMilestone, MilestoneType, UserProfile, ServiceRecord } from '../types';

const ROLES_OPTIONS = [
  'Bombero Razo',
  'Distinguido',
  'Cabo Segundo',
  'Cabo Primero',
  'Sargento Segundo',
  'Sargento Primero',
  'Sargento Mayor',
  'Teniente',
  'Primer Teniente',
  'Capitán',
  'Mayor',
  'Teniente Coronel',
  'Coronel'
];

interface HistoryViewProps {
  milestones: HumanMilestone[];
  onAddMilestone: (milestone: Omit<HumanMilestone, 'id'>) => void;
  onDeleteMilestone: (id: string) => void;
  sessionUser: UserProfile | null;
  onUpdateProfile: (updated: UserProfile) => void;
  recordsCount?: number; // Optional prop to show actual logged incidents count
  records?: ServiceRecord[];
}

export default function HistoryView({ 
  milestones, 
  onAddMilestone, 
  onDeleteMilestone,
  sessionUser,
  onUpdateProfile,
  records = []
}: HistoryViewProps) {
  
  // Add milestone form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    personnelId: sessionUser?.personnelId || 'V-12345678',
    type: 'Certification' as MilestoneType,
    title: '',
    description: '',
    date: new Date().toISOString().substring(0, 10)
  });

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editBloodType, setEditBloodType] = useState('O+');
  const [editNationality, setEditNationality] = useState<'V' | 'E'>('V');
  const [editIdNumber, setEditIdNumber] = useState('');
  const [editRole, setEditRole] = useState('Teniente');

  // Editable assignment text
  const [editableAssignment, setEditableAssignment] = useState('');
  
  // Feedback states
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Print & Iframe detection states
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showDraftMode, setShowDraftMode] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const isIframe = useMemo(() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true; // Safe fallback
    }
  }, []);

  const handlePrintAction = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setSuccessMsg("Generando documento PDF oficial. Por favor espere...");
    
    const wasDraftModeOff = !showDraftMode;
    
    if (wasDraftModeOff) {
      setShowDraftMode(true);
    }
    
    // Give UI time to update the button, render the draft mode in DOM, and load any assets
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let originalClassName = '';
    try {
      const element = document.getElementById('printable-expediente');
      if (!element) {
        throw new Error('Elemento de expediente no encontrado');
      }

      // Temporarily hide the draft helper badge from the PDF output
      const noPrintElements = element.querySelectorAll('.no-print');
      const hiddenStates: string[] = [];
      noPrintElements.forEach((el, index) => {
        hiddenStates[index] = (el as HTMLElement).style.display;
        (el as HTMLElement).style.display = 'none';
      });

      // Temporarily remove border classes from the main container
      originalClassName = element.className;
      element.className = "block max-w-full mx-auto p-6 bg-white text-black print:block w-[800px]";

      const safeName = userFullName.replace(/\s+/g, '_').toLowerCase();
      const safeId = userCedulaId.replace(/\D/g, '') || 'registro';

      const opt = {
        margin:       [0.4, 0.4, 0.4, 0.4] as [number, number, number, number], 
        filename:     `expediente_${safeName}_${safeId}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true,
          logging: false, // Keep console clean to prevent freezing on huge logs
          windowWidth: 800,
          onclone: (doc: Document) => {
            // Remove the dark border and rounded styles from the cloned container specifically for the PDF render
            const pdfContainer = doc.getElementById('printable-expediente');
            if (pdfContainer) {
              pdfContainer.style.border = 'none';
              pdfContainer.style.borderRadius = '0';
              pdfContainer.style.boxShadow = 'none';
              pdfContainer.style.outline = 'none';
              pdfContainer.style.margin = '0';
              pdfContainer.className = pdfContainer.className
                .replace(/border-4/g, '')
                .replace(/border-slate-[0-9]+/g, '')
                .replace(/rounded-[a-z0-9]+/g, '')
                .replace(/shadow-[a-z0-9]+/g, '')
                .replace(/ring-[0-9]+/g, '')
                .replace(/mt-[0-9]+/g, '')
                .replace(/mb-[0-9]+/g, '');
            }

            // STEP 1: Force explicit white background and black text on the entire print area
            // This prevents oklch/color-mix replacements from accidentally making backgrounds black.
            try {
              const printArea = doc.getElementById('printable-expediente');
              if (printArea) {
                // Force root styles
                (printArea as HTMLElement).style.backgroundColor = '#ffffff';
                (printArea as HTMLElement).style.color = '#000000';

                // Force all descendants to use safe explicit colors
                const allPrintEls = printArea.querySelectorAll('*');
                allPrintEls.forEach(el => {
                  const htmlEl = el as HTMLElement;
                  // Reset background on any element that had a Tailwind background class
                  const cls = htmlEl.className || '';
                  if (typeof cls === 'string') {
                    // Section boxes that need light gray background
                    if (cls.includes('bg-slate-50') || cls.includes('bg-slate-100')) {
                      htmlEl.style.backgroundColor = '#f8fafc';
                      htmlEl.style.color = '#000000';
                    }
                    // White background areas (tables, etc.)
                    if (cls.includes('bg-white')) {
                      htmlEl.style.backgroundColor = '#ffffff';
                      htmlEl.style.color = '#000000';
                    }
                    // Elements that may have dark bg from Tailwind resolving to oklch
                    if (cls.includes('bg-slate-') || cls.includes('bg-gray-') || cls.includes('bg-zinc-')) {
                      const existingBg = htmlEl.style.backgroundColor;
                      if (!existingBg || existingBg === '' || existingBg === 'transparent') {
                        htmlEl.style.backgroundColor = '#ffffff';
                      }
                    }
                    // Ensure all text elements have black color
                    if (cls.includes('text-slate-') || cls.includes('text-gray-') || cls.includes('text-black')) {
                      htmlEl.style.color = '#000000';
                    }
                    if (cls.includes('text-slate-600') || cls.includes('text-slate-700') || cls.includes('text-slate-500')) {
                      htmlEl.style.color = '#475569';
                    }
                  }
                });

                // Specifically handle the photo placeholder: replace SVG icons with plain text
                const photoPlaceholder = printArea.querySelector('#pdf-photo-placeholder');
                if (photoPlaceholder) {
                  (photoPlaceholder as HTMLElement).style.backgroundColor = '#f1f5f9';
                  (photoPlaceholder as HTMLElement).style.color = '#64748b';
                  // Remove any SVG children (lucide icons that cause rendering artifacts)
                  const svgs = photoPlaceholder.querySelectorAll('svg');
                  svgs.forEach(svg => svg.remove());
                }

                // Force the assignment/summary section box to be explicitly light-colored
                const assignmentBox = printArea.querySelector('#pdf-assignment-box');
                if (assignmentBox) {
                  (assignmentBox as HTMLElement).style.backgroundColor = '#f8fafc';
                  (assignmentBox as HTMLElement).style.color = '#000000';
                  (assignmentBox as HTMLElement).style.border = '1px solid #000000';
                  const assignmentChildren = assignmentBox.querySelectorAll('*');
                  assignmentChildren.forEach(child => {
                    (child as HTMLElement).style.color = '#000000';
                    (child as HTMLElement).style.backgroundColor = 'transparent';
                  });
                }
              }
            } catch (err) {
              console.error("Error forcing explicit colors on print area:", err);
            }

            // STEP 2: Clean inline style attributes, color attributes, and SVG attributes (like fill, stroke) on all elements
            try {
              const allElements = doc.querySelectorAll('*');
              allElements.forEach(el => {
                // 1. Check style attribute
                const styleAttr = el.getAttribute('style');
                if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('color-mix'))) {
                  el.setAttribute('style', styleAttr
                    .replace(/oklch\([^)]+\)/gi, '#000000')
                    .replace(/color-mix\([^)]+\)/gi, 'inherit')
                  );
                }
                // 2. Check SVG fill attribute
                const fillAttr = el.getAttribute('fill');
                if (fillAttr && (fillAttr.includes('oklch') || fillAttr.includes('color-mix'))) {
                  el.setAttribute('fill', '#000000');
                }
                // 3. Check SVG stroke attribute
                const strokeAttr = el.getAttribute('stroke');
                if (strokeAttr && (strokeAttr.includes('oklch') || strokeAttr.includes('color-mix'))) {
                  el.setAttribute('stroke', '#000000');
                }
                // 4. Check color attribute
                const colorAttr = el.getAttribute('color');
                if (colorAttr && (colorAttr.includes('oklch') || colorAttr.includes('color-mix'))) {
                  el.setAttribute('color', '#000000');
                }
              });
            } catch (err) {
              console.error("Error cleaning element attributes in clone:", err);
            }

            // STEP 3: Extract all CSS rules from the cloned document's stylesheets (including CSSOM injected rules)
            let combinedCss = '';
            try {
              const sheets = Array.from(doc.styleSheets);
              sheets.forEach(sheet => {
                try {
                  const rules = sheet.cssRules || sheet.rules;
                  if (rules) {
                    for (let i = 0; i < rules.length; i++) {
                      combinedCss += rules[i].cssText + '\n';
                    }
                  } else if (sheet.ownerNode && sheet.ownerNode.textContent) {
                    combinedCss += sheet.ownerNode.textContent + '\n';
                  }
                } catch (e) {
                  if (sheet.ownerNode && sheet.ownerNode.textContent) {
                    combinedCss += sheet.ownerNode.textContent + '\n';
                  }
                }
              });
            } catch (err) {
              console.error("Error reading styleSheets in clone:", err);
            }

            if (!combinedCss.trim()) {
              const styleTags = doc.querySelectorAll('style');
              styleTags.forEach(t => {
                if (t.textContent) {
                  combinedCss += t.textContent + '\n';
                }
              });
            }

            // Clean oklch and color-mix functions which cause html2canvas to crash.
            const cleanedCss = combinedCss
              .replace(/oklch\([^)]+\)/gi, '#000000')
              .replace(/color-mix\([^)]+\)/gi, 'inherit');

            // Remove all existing style and stylesheet link elements in the cloned document
            const styleNodes = doc.querySelectorAll('style, link[rel="stylesheet"]');
            styleNodes.forEach(node => {
              if (node.parentNode) {
                node.parentNode.removeChild(node);
              }
            });

            // STEP 4: Create a brand new single inline style tag with the sanitized CSS rules
            // Also inject explicit base styles to guarantee white background on print area
            const newStyle = doc.createElement('style');
            newStyle.textContent = cleanedCss + `
              #printable-expediente, #printable-expediente * {
                -webkit-print-color-adjust: exact !important;
              }
              #printable-expediente {
                background-color: #ffffff !important;
                color: #000000 !important;
              }
              #pdf-assignment-box {
                background-color: #f8fafc !important;
                color: #000000 !important;
                border: 1px solid #000000 !important;
              }
              #pdf-assignment-box * {
                color: #000000 !important;
                background-color: transparent !important;
              }
              #pdf-photo-placeholder {
                background-color: #f1f5f9 !important;
                color: #64748b !important;
                border: 1px dashed #94a3b8 !important;
              }
            `;
            doc.head.appendChild(newStyle);

            // STEP 5: Override getComputedStyle on the cloned document's window (doc.defaultView)
            // to catch any computed color values containing oklch or color-mix and return a fallback
            try {
              const win = doc.defaultView;
              if (win) {
                const originalGetComputedStyle = win.getComputedStyle;
                win.getComputedStyle = function(el, pseudoElt) {
                  const style = originalGetComputedStyle.call(win, el, pseudoElt);
                  return new Proxy(style, {
                    get(target, prop) {
                      const val = target[prop];
                      if (typeof val === 'function') {
                        return function(...args) {
                          const res = val.apply(target, args);
                          if (typeof res === 'string') {
                            if (res.includes('oklch') || res.includes('color-mix')) {
                              return '#000000';
                            }
                          }
                          return res;
                        };
                      }
                      if (typeof val === 'string') {
                        if (val.includes('oklch') || val.includes('color-mix')) {
                          return '#000000';
                        }
                      }
                      return val;
                    }
                  });
                };
              }
            } catch (err) {
              console.error("Error overriding getComputedStyle in clone:", err);
            }
          }
        },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      };

      await html2pdf().from(element).set(opt).save();

      // Restore elements
      element.className = originalClassName;
      noPrintElements.forEach((el, index) => {
        (el as HTMLElement).style.display = hiddenStates[index] || '';
      });
      
      setSuccessMsg("¡Expediente descargado con éxito en formato PDF!");
      setTimeout(() => setSuccessMsg(null), 5000);
      
    } catch (err: any) {
      console.error("PDF generator fail:", err);
      setValidationError("Error al generar PDF: " + (err.message || "Error desconocido"));
      setTimeout(() => setValidationError(null), 6000);
      
      const el = document.getElementById('printable-expediente');
      if (el && typeof el.className !== 'undefined') {
        el.className = originalClassName;
        const hiddenEl = el.querySelectorAll('.no-print');
        hiddenEl.forEach(child => {
          (child as HTMLElement).style.display = '';
        });
      }
    } finally {
      setIsGeneratingPdf(false);
      if (wasDraftModeOff) {
        setTimeout(() => setShowDraftMode(false), 500);
      }
    }
  };

  // Sync state with active user
  useEffect(() => {
    if (sessionUser) {
      setNewMilestone(prev => ({
        ...prev,
        personnelId: sessionUser.personnelId
      }));
    }
  }, [sessionUser]);

  // Handle opening profile editor with clean states
  const handleStartEdit = () => {
    if (sessionUser) {
      const cleanFirst = sessionUser.firstName || sessionUser.name.split(' ')[0] || '';
      const cleanLast = sessionUser.lastName || sessionUser.name.split(' ').slice(1).join(' ') || '';
      
      setEditFirstName(cleanFirst.toUpperCase());
      setEditLastName(cleanLast.toUpperCase());
      setEditBloodType(sessionUser.bloodType || 'O+');
      setEditRole(sessionUser.role || 'Teniente');

      const pId = sessionUser.personnelId || '';
      if (pId.includes('-')) {
        const parts = pId.split('-');
        setEditNationality(parts[0] === 'E' ? 'E' : 'V');
        setEditIdNumber(parts[1] || '');
      } else {
        setEditNationality('V');
        setEditIdNumber(pId.replace(/[^0-9]/g, ''));
      }
    } else {
      // Default placeholder values for mock Jonathan Hayes profile demo editing
      setEditFirstName('JONATHAN');
      setEditLastName('HAYES');
      setEditBloodType('O+');
      setEditRole('Teniente');
      setEditNationality('V');
      setEditIdNumber('8821000');
    }
    setValidationError(null);
    setPhotoError(null);
    setIsEditing(true);
  };

  // Secure photo upload handler with dual binary and MIME validation
  // Restriction: Only image/jpeg and image/png are allowed (no gif, webp, any other extension or mime)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Strict mime-type verification (JPEG and PNG only, no GIF or WEBP)
    const allowedMimeTypes = ['image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(file.type)) {
      setPhotoError('ERROR DE SEGURIDAD: Solo se permiten exclusivamente formatos de imagen seguros (JPEG o PNG) para prevenir archivos sospechosos.');
      return;
    }

    // 2. Strict file extension double-check
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png'];
    if (!extension || !allowedExtensions.includes(extension)) {
      setPhotoError('ERROR DE SEGURIDAD: La extensión del archivo debe ser exclusivamente .jpg, .jpeg o .png.');
      return;
    }

    // 3. File size limit: 2MB to keep browser memory and storage optimized
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('El tamaño del archivo excede el límite de 2 MB.');
      return;
    }

    // 4. File reading with secondary image structure validation
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Content = event.target?.result as string;
      const img = new Image();
      
      // Attempt loading image layout to ensure it's a real binary and not a disguised executable
      img.onload = async () => {
        // Safe image structure validated! We update state and server
        if (sessionUser) {
          try {
            const first = sessionUser.firstName || sessionUser.name.split(' ')[0] || '';
            const last = sessionUser.lastName || sessionUser.name.split(' ').slice(1).join(' ') || '';

            const data = await window.electronAPI.updateProfile({
              username: sessionUser.username,
              firstName: first,
              lastName: last,
              personnelId: sessionUser.personnelId,
              bloodType: sessionUser.bloodType || 'O+',
              photoBase64: base64Content
            });
            if (data.error) {
              throw new Error(data.error);
            }

            onUpdateProfile(data);
            setSuccessMsg('Foto de perfil actualizada exitosamente en formato carnet estándar (JPEG/PNG).');
            setTimeout(() => setSuccessMsg(null), 4000);
          } catch (err: any) {
            setPhotoError(err.message || 'Error al sincronizar la foto de perfil con el servidor central de bomberos.');
          }
        } else {
          setPhotoError('Inicie sesión en su portal para cambiar la foto del perfil del sistema.');
        }
      };
      img.onerror = () => {
        setPhotoError('ERROR DE SEGURIDAD: El contenido del archivo no es una estructura de imagen JPEG o PNG válida.');
      };
      img.src = base64Content;
    };
    reader.onerror = () => {
      setPhotoError('No se pudo leer el archivo seleccionado.');
    };
    reader.readAsDataURL(file);
  };

  // Save profile edits with server validation and strict uniqueness checks for Cédula de Identidad
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const first = editFirstName.trim().toUpperCase();
    const last = editLastName.trim().toUpperCase();

    if (!first || !last || !editIdNumber) {
      setValidationError('Todos los campos indicados con (*) son obligatorios.');
      return;
    }

    // Standard letters-only validation pattern matching register constraints
    if (!/^[A-ZÁÉÍÓÚÜÑ\s]{1,20}$/.test(first)) {
      setValidationError('El Nombre solo debe incluir letras del alfabeto castellano (máx. 20 caracteres) sin números.');
      return;
    }

    if (!/^[A-ZÁÉÍÓÚÜÑ\s]{1,20}$/.test(last)) {
      setValidationError('El Apellido solo debe incluir letras del alfabeto castellano (máx. 20 caracteres) sin números.');
      return;
    }

    // Digits-only check for Cédula de Identidad matching register constraints
    if (!/^\d{1,10}$/.test(editIdNumber)) {
      setValidationError('La Cédula de Identidad solo debe de ser un número entero (máximo 10 dígitos).');
      return;
    }

    const formattedPersonnelId = `${editNationality}-${editIdNumber}`;

    if (!sessionUser) {
      setValidationError('No hay un perfil de sesión activa para guardar de forma persistente.');
      return;
    }

    try {
      const data = await window.electronAPI.updateProfile({
        username: sessionUser.username,
        firstName: first,
        lastName: last,
        personnelId: formattedPersonnelId,
        bloodType: editBloodType,
        photoBase64: sessionUser.photoBase64,
        role: editRole
      });

      if (data.error) {
        throw new Error(data.error);
      }

      onUpdateProfile(data);
      setIsEditing(false);
      setSuccessMsg('Sus datos de oficial de bomberos han sido actualizados y sincronizados de inmediato.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setValidationError(err.message || 'Error de comunicación al actualizar datos. Cédula duplicada o error de red.');
    }
  };

  // Handle custom milestone creation
  const handleMilestoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestone.title || !newMilestone.description) {
      alert("Por favor complete toda la información del hito.");
      return;
    }
    onAddMilestone(newMilestone);
    setNewMilestone({
      personnelId: sessionUser?.personnelId || 'V-12345678',
      type: 'Certification',
      title: '',
      description: '',
      date: new Date().toISOString().substring(0, 10)
    });
    setShowAddForm(false);
  };

  // Profile fields helper (dynamic or fallback mock Jonathan Hayes)
  const isSessionActive = !!sessionUser;
  const userFirst = sessionUser?.firstName || 'JONATHAN';
  const userLast = sessionUser?.lastName || 'HAYES';
  const userFullName = sessionUser?.name || 'JONATHAN HAYES';
  const userRoleStr = sessionUser?.role || 'Teniente';
  const userBlood = sessionUser?.bloodType || 'O+';
  const userCedulaId = sessionUser?.personnelId || 'V-8821000';
  const userPhoto = sessionUser?.photoBase64 || "";

  // Dynamic user specific records & manual milestones for absolute consistency
  const userMilestones = useMemo(() => {
    const userCleanId = userCedulaId.replace(/\D/g, '');
    return milestones.filter(m => m.personnelId && m.personnelId.replace(/\D/g, '') === userCleanId);
  }, [milestones, userCedulaId]);

  const userRecords = useMemo(() => {
    const userCleanId = userCedulaId.replace(/\D/g, '');
    return records ? records.filter(r => r.personnelId && r.personnelId.replace(/\D/g, '') === userCleanId) : [];
  }, [records, userCedulaId]);

  // Unified chronological event type definition
  interface TimelineEvent {
    id: string;
    date: string;
    title: string;
    description: string;
    category: 'Promotion' | 'Certification' | 'Commendation' | 'Onboarding' | 'Incident';
    originalId: string;
    status?: string;
    serviceType?: string;
  }

  // Merging both incident records and manual user milestones chronologically
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // 1. Add academic and milestones logs
    userMilestones.forEach(m => {
      events.push({
        id: `milestone-${m.id}`,
        date: m.date,
        title: m.title,
        description: m.description,
        category: m.type,
        originalId: m.id
      });
    });

    // 2. Add real-time entered emergency dispatches / services
    userRecords.forEach(r => {
      const rDate = r.serviceDate || r.timestamp?.substring(0, 10) || new Date().toISOString().substring(0, 10);
      events.push({
        id: `record-${r.id}`,
        date: rDate,
        title: `Servicio Operativo: ${r.serviceType}`,
        description: `${r.summary}`,
        category: 'Incident',
        originalId: r.id,
        status: r.status,
        serviceType: r.serviceType
      });
    });

    // Sort descending (newest first)
    return events.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (timeB !== timeA) {
        return timeB - timeA;
      }
      return b.id.localeCompare(a.id);
    });
  }, [userMilestones, userRecords]);

  // Dynamic values based on records and milestones
  // Parses a date string (YYYY-MM-DD) as local timezone to avoid UTC offset issues
  const parseLocalDate = (dateStr: string): Date => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date(dateStr);
  };

  // Calculates years of service using month-based precision for accuracy
  const calcYearsFromDate = (startDate: Date): number => {
    const now = new Date();
    const totalMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
    // If we haven't reached the same day of the month yet, subtract one month
    const adjustedMonths = now.getDate() >= startDate.getDate() ? totalMonths : totalMonths - 1;
    return Math.max(0, adjustedMonths / 12);
  };

  const calculatedYearsOfService = useMemo(() => {
    const onboarding = userMilestones.find(m => m.type === 'Onboarding');
    if (onboarding) {
      const startDate = parseLocalDate(onboarding.date);
      const yrs = calcYearsFromDate(startDate);
      return yrs > 0 ? yrs.toFixed(2) : '0';
    }
    // Fallback based on earliest record
    const dates = [
      ...userMilestones.map(m => parseLocalDate(m.date).getTime()),
      ...userRecords.map(r => parseLocalDate(r.serviceDate || r.timestamp?.substring(0, 10) || '').getTime())
    ].filter(t => !isNaN(t));

    if (dates.length > 0) {
      const earliest = Math.min(...dates);
      const startDate = new Date(earliest);
      const yrs = calcYearsFromDate(startDate);
      return yrs > 0 ? yrs.toFixed(2) : '0';
    }
    return '0';
  }, [userMilestones, userRecords]);

  const defaultCondecoraciones = useMemo(() => {
    const accomplishments = userMilestones.filter(m => m.type === 'Commendation' || m.type === 'Certification' || m.type === 'Promotion');
    return accomplishments.length; // Defaults to 0 if no milestones are present
  }, [userMilestones]);

  const defaultAssignment = isSessionActive 
    ? `Oficial de guardia asignado a la Escuadra Operativa del Cuerpo de Bomberos USM. Registro de identificación: ${userCedulaId}.`
    : `Asignado desde el 12 de Octubre de 2021. Sus responsabilidades cruciales comprenden operaciones de extracción pesada, respuesta HazMat y soporte vital avanzado en emergencias médicas complejas.`;

  // Sync editable assignment when default changes (e.g. on login or cedula update)
  useEffect(() => {
    setEditableAssignment(prev => {
      // Only auto-update if the user hasn't customized it yet (it still equals the old default pattern)
      if (!prev || prev === defaultAssignment) return defaultAssignment;
      return prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCedulaId, isSessionActive]);

  // Helper to classify sub-types of incident
  const getIncidentTheme = (serviceType: string) => {
    const t = (serviceType || '').toLowerCase();
    
    // 1. INCENDIOS Y EXTINTORES (Flame icon / Rose/Red colors)
    if (
      t.includes('incendio') || 
      t.includes('quema') || 
      t.includes('extintor') || 
      t.includes('combustible') ||
      t.includes('flama')
    ) {
      return 'fire';
    }
    
    // 2. ACCIDENTES VIALES (Car icon / Amber/Orange colors)
    if (
      t.includes('vial') || 
      t.includes('colisión') || 
      t.includes('arrollamiento') || 
      t.includes('volcamiento') ||
      t.includes('choque')
    ) {
      return 'road';
    }
    
    // 3. ATENCIÓN MÉDICA Y FARMACÉUTICA (Activity icon / Emerald/Teal colors)
    if (
      t.includes('paciente') || 
      t.includes('medicamento') || 
      t.includes('pre-hospitalaria') || 
      t.includes('estabilización') || 
      t.includes('cura') || 
      t.includes('nebulización') || 
      t.includes('arterial') || 
      t.includes('ambulancia') || 
      t.includes('traslado') || 
      t.includes('médico') || 
      t.includes('hospital') ||
      t.includes('signos vitales') ||
      t.includes('tensión')
    ) {
      return 'medical';
    }

    // 4. MEDIO AMBIENTE Y RIESGO URBANO (AlertTriangle icon / Yellow/Amber colors)
    if (
      t.includes('árbol') || 
      t.includes('poda') || 
      t.includes('tala') || 
      t.includes('riesgo') || 
      t.includes('seguridad') || 
      t.includes('animal') || 
      t.includes('avispa') || 
      t.includes('mitigación')
    ) {
      return 'risk';
    }
    
    // 5. ASUNTOS ADMINISTRATIVOS Y OPERACIONALES (Briefcase icon / Indigo/Slate colors)
    return 'administrative';
  };

  // Milestone/Event Icon helpers for chronological timeline
  const getEventIcon = (event: TimelineEvent) => {
    switch (event.category) {
      case 'Promotion':
        return <Star className="w-5 h-5 text-white fill-white" />;
      case 'Certification':
        return <ShieldCheck className="w-5 h-5 text-indigo-400" />;
      case 'Commendation':
        return <Award className="w-5 h-5 text-amber-500 fill-amber-100" />;
      case 'Onboarding':
        return <Briefcase className="w-5 h-5 text-slate-300" />;
      case 'Incident': {
        const theme = getIncidentTheme(event.serviceType || '');
        if (theme === 'fire') return <Flame className="w-5 h-5 text-rose-500 fill-rose-950/20" />;
        if (theme === 'road') return <Car className="w-5 h-5 text-amber-500" />;
        if (theme === 'medical') return <Activity className="w-5 h-5 text-emerald-400" />;
        if (theme === 'risk') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
        return <Briefcase className="w-5 h-5 text-indigo-400" />;
      }
      default:
        return <CheckCircle2 className="w-5 h-5 text-slate-500" />;
    }
  };

  const getEventIconBgClass = (event: TimelineEvent) => {
    switch (event.category) {
      case 'Promotion':
        return 'bg-rose-500 text-white shadow-sm ring-4 ring-rose-950/20';
      case 'Certification':
        return 'bg-slate-800 text-slate-200 ring-4 ring-slate-900/25 border border-indigo-900/40';
      case 'Commendation':
        return 'bg-amber-100 text-amber-900 ring-4 ring-amber-950/20';
      case 'Onboarding':
        return 'bg-sky-600 text-white ring-4 ring-sky-950/20';
      case 'Incident': {
        const theme = getIncidentTheme(event.serviceType || '');
        if (theme === 'fire') return 'bg-rose-950/60 text-rose-450 ring-4 ring-rose-950/25 border border-rose-500/25';
        if (theme === 'road') return 'bg-amber-950/60 text-amber-455 ring-4 ring-amber-950/25 border border-amber-500/25';
        if (theme === 'medical') return 'bg-emerald-950/60 text-emerald-400 ring-4 ring-emerald-950/25 border border-emerald-500/25';
        if (theme === 'risk') return 'bg-yellow-950/60 text-yellow-400 ring-4 ring-yellow-950/25 border border-yellow-500/25';
        return 'bg-indigo-950/60 text-indigo-450 ring-4 ring-indigo-950/25 border border-indigo-500/25';
      }
      default:
        return 'bg-slate-600 text-white';
    }
  };

  const getEventBadge = (event: TimelineEvent) => {
    switch (event.category) {
      case 'Promotion':
        return { text: 'Ascenso Milit.', classes: 'bg-rose-950/20 text-rose-300 border-rose-900/30' };
      case 'Certification':
        return { text: 'Acreditación', classes: 'bg-slate-900/45 text-slate-350 border-slate-850' };
      case 'Commendation':
        return { text: 'Condecoración de Honor', classes: 'bg-amber-950/20 text-amber-300 border-amber-900/30' };
      case 'Onboarding':
        return { text: 'Alta / Ingreso', classes: 'bg-sky-950/20 text-sky-300 border-sky-900/20' };
      case 'Incident': {
        const theme = getIncidentTheme(event.serviceType || '');
        if (theme === 'fire') return { text: 'Control de Incendio', classes: 'bg-[#991b1b]/20 text-rose-350 border-red-900/30' };
        if (theme === 'road') return { text: 'Auxilio Vial / Choque', classes: 'bg-amber-950/25 text-amber-300 border-amber-900/25' };
        if (theme === 'medical') return { text: 'Paramédico / Salud', classes: 'bg-[#064e3b]/20 text-emerald-300 border-emerald-900/30' };
        if (theme === 'risk') return { text: 'Mitigación de Riesgos', classes: 'bg-yellow-950/20 text-yellow-300 border-yellow-900/25' };
        return { text: 'Planificación / Rutina', classes: 'bg-indigo-950/25 text-indigo-350 border-indigo-900/25' };
      }
      default:
        return { text: 'Historial', classes: 'bg-slate-900/45 text-slate-350 border-slate-850' };
    }
  };

  const printableEmittedDate = useMemo(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return today.toLocaleDateString('es-ES', options);
  }, []);

  return (
    <div className="font-sans relative">
      {/* Screen Interface Wrapper */}
      <div id="history-view-screen-root" className="animate-fade-in space-y-8 print:hidden">
        {/* Page Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Expediente Operativo Personal</h1>
            <p className="text-slate-400 mt-1 text-sm font-medium">Historial detallado de servicios, hoja de vida y credenciales validadas del oficial de guardia.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Toggle to inspect print draft directly in the browser viewport */}
            <button 
              type="button"
              onClick={() => {
                setShowDraftMode(!showDraftMode);
                // Scroll down smoothly to show the preview document
                if(!showDraftMode) {
                  setTimeout(() => {
                    document.getElementById('printable-expediente')?.scrollIntoView({ behavior: 'smooth' });
                  }, 120);
                }
              }}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border font-bold text-xs tracking-wide uppercase transition-all cursor-pointer ${
                showDraftMode 
                  ? 'bg-indigo-650 border-indigo-500 text-white shadow-lg shadow-indigo-600/35 font-extrabold' 
                  : 'bg-slate-900 border-slate-800/80 text-slate-300 hover:text-slate-100 hover:bg-[#1e293b]'
              }`}
            >
              {showDraftMode ? <EyeOff className="w-4 h-4 text-indigo-200" /> : <Eye className="w-4 h-4 text-indigo-400" />}
              {showDraftMode ? 'Cerrar Vista de Hoja' : 'Previsualizar Hoja'}
            </button>

            <button 
              type="button"
              onClick={handlePrintAction}
              disabled={isGeneratingPdf}
              className={`flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-bold text-xs tracking-wide uppercase transition-all border shadow-lg ${
                isGeneratingPdf
                  ? 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-550 hover:border-indigo-500 cursor-pointer shadow-indigo-600/15'
              }`}
            >
              {isGeneratingPdf ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando PDF...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 text-white" />
                  Imprimir / PDF
                </>
              )}
            </button>
          </div>
        </div>

      {/* Global alert messages */}
      {(successMsg || photoError || validationError) && (
        <div className="space-y-2">
          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}
          {photoError && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/20 text-rose-200 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-semibold">{photoError}</span>
            </div>
          )}
          {validationError && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/20 text-rose-200 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-semibold">{validationError}</span>
            </div>
          )}
        </div>
      )}

      {/* Bento Layout: Interactive Profile & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Interactive Profile Card with standard vertical "Foto Carnet" proportions */}
        <div id="personal-profile-root" className="md:col-span-5 bg-[#0f172a]/30 border border-slate-800/85 rounded-2xl p-6 flex flex-col items-center shadow-xl backdrop-blur-md relative">
          
          {!isEditing ? (
            // VIEW PROFILE MODE
            <div className="w-full flex flex-col items-center text-center">
              
              {/* Photo Carnet Box: 4:5 vertical aspects standard standard (Width 128px, Height 160px for elegant portrait) */}
              <div className="w-32 h-40 max-w-full bg-slate-900 border-4 border-slate-950/80 rounded-xl shadow-xl overflow-hidden mb-5 relative group shrink-0 flex items-center justify-center">
                {userPhoto ? (
                  <img 
                    alt={`Foto Carnet de ${userFullName}`} 
                    className="w-full h-full object-cover animate-fade-in" 
                    src={userPhoto}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-3.5 h-full w-full bg-slate-950/40 text-slate-400 gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800/80 flex items-center justify-center shadow-md">
                      <Camera className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6366f1] leading-snug">
                      Cambiar foto
                    </span>
                    <span className="text-[8px] text-slate-500 font-semibold leading-normal">
                      Haz clic para subir tu foto de perfil
                    </span>
                  </div>
                )}
                
                {/* Upload camera overlay */}
                <label className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[10px] uppercase font-bold tracking-wider shrink-0 gap-1.5 p-2 text-center">
                  <Camera className="w-5 h-5 text-indigo-400" />
                  <span>Subir Foto Carnet</span>
                  <span className="text-[8px] text-slate-350 lowercase text-center font-normal">solamente JPEG/PNG (max 2 Mb)</span>
                  <input 
                    type="file" 
                    accept="image/jpeg, image/png" 
                    onChange={handlePhotoUpload} 
                    className="hidden" 
                  />
                </label>
              </div>

              {/* Identifier tag */}
              <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest bg-indigo-950/40 border border-indigo-900/60 rounded-full px-3 py-1 mb-3">
                {userRoleStr}
              </span>

              <h2 className="text-xl font-extrabold text-slate-100 tracking-tight leading-tight uppercase">
                {userFirst} <br />
                <span className="text-slate-300 font-bold">{userLast}</span>
              </h2>

              <p className="text-[11px] font-bold text-slate-450 uppercase tracking-wider mt-1.5">
                Cédula: {userCedulaId}
              </p>

              {/* Status active badge */}
              <div className="mt-4 flex justify-center gap-2 w-full">
                <span className="px-3 py-1 bg-emerald-950/30 text-emerald-350 border border-emerald-900/40 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)] animate-pulse" /> OFICIAL ACTIVO
                </span>
              </div>

              {/* Profile variables details section */}
              <div className="mt-6 w-full text-left border-t border-slate-800/80 pt-4.5 space-y-4 font-sans">
                <div className="bg-slate-950/30 border border-slate-800/60 rounded-xl p-3 flex justify-between items-center shadow-inner">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Grupo Sanguíneo</span>
                  <span className="font-mono text-xs font-extrabold text-slate-200 uppercase bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                    FACT {userBlood}
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleStartEdit}
                    className="w-full bg-[#1e293b] hover:bg-slate-850 text-slate-200 font-bold text-xs tracking-wider uppercase py-2.5 px-4 rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer outline-none"
                    title="Modificar Nombre, Apellido, Cédula o Tipo de Sangre"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-450" />
                    Modificar Datos de Oficial
                  </button>
                </div>
              </div>

            </div>
          ) : (
            // EDIT PROFILE FORM MODE
            <form onSubmit={handleSaveProfile} className="w-full space-y-4.5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <h3 className="text-xs font-extrabold text-slate-100 uppercase tracking-widest">Modificar Mis Credenciales</h3>
                <span className="text-[9px] font-bold text-indigo-400 font-mono">Validación de Seguridad</span>
              </div>

              {/* Photo Input in Edit Mode */}
              <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                <div className="w-12 h-15 bg-slate-900 rounded-md overflow-hidden shrink-0 border border-slate-850 relative flex items-center justify-center">
                  {userPhoto ? (
                    <img src={userPhoto} className="w-full h-full object-cover" alt="Carnet" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Foto de Identificación</span>
                  <label className="inline-block mt-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800/60 px-3 py-1 rounded text-[10px] font-bold uppercase text-indigo-200 cursor-pointer">
                    Seleccionar Archivo
                    <input type="file" accept="image/jpeg, image/png" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  <p className="text-[8px] text-slate-500 mt-0.5">JPEG, PNG (Carnet máx 2MB)</p>
                </div>
              </div>

              {/* Nombre component edit */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre <span className="text-rose-500">*</span></label>
                  <span className="text-[9px] text-slate-500 font-mono">{editFirstName.length}/20 máx</span>
                </div>
                <input
                  type="text"
                  maxLength={20}
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '').toUpperCase())}
                  placeholder="SOLO LETRAS DEL NOMBRE"
                  className="w-full bg-slate-950/85 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-xs text-slate-100 transition-all outline-none font-bold placeholder-slate-705 uppercase"
                  required
                />
              </div>

              {/* Apellido component edit */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apellido <span className="text-rose-500">*</span></label>
                  <span className="text-[9px] text-slate-500 font-mono">{editLastName.length}/20 máx</span>
                </div>
                <input
                  type="text"
                  maxLength={20}
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '').toUpperCase())}
                  placeholder="SOLO LETRAS DEL APELLIDO"
                  className="w-full bg-slate-950/85 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-xs text-slate-100 transition-all outline-none font-bold placeholder-slate-705 uppercase"
                  required
                />
              </div>

              {/* Cédula edit with dropdown selector */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cédula de Identidad <span className="text-rose-500">*</span></label>
                  <span className="text-[9px] text-slate-500 font-mono">{editIdNumber.length}/10 dígitos</span>
                </div>
                <div className="flex gap-2">
                  <select
                    value={editNationality}
                    onChange={(e) => setEditNationality(e.target.value as 'V' | 'E')}
                    className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2 text-xs font-bold focus:border-indigo-500 transition-all outline-none h-9 cursor-pointer shrink-0"
                  >
                    <option value="V">V-</option>
                    <option value="E">E-</option>
                  </select>
                  <input
                    type="text"
                    maxLength={10}
                    value={editIdNumber}
                    onChange={(e) => setEditIdNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Escriba los números"
                    className="w-full bg-slate-950/85 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-xs text-slate-100 transition-all outline-none font-mono font-medium"
                    required
                  />
                </div>
              </div>

              {/* Blood group selection edit entry */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grupo Sanguíneo</label>
                <select
                  value={editBloodType}
                  onChange={(e) => setEditBloodType(e.target.value)}
                  className="w-full bg-slate-950/85 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-xs text-slate-200 transition-all outline-none h-9 cursor-pointer font-medium"
                >
                  <option value="O+">FACT O-POSITIVO (O+)</option>
                  <option value="O-">FACT O-NEGATIVO (O-)</option>
                  <option value="A+">FACT A-POSITIVO (A+)</option>
                  <option value="A-">FACT A-NEGATIVO (A-)</option>
                  <option value="B+">FACT B-POSITIVO (B+)</option>
                  <option value="B-">FACT B-NEGATIVO (B-)</option>
                  <option value="AB+">FACT AB-POSITIVO (AB+)</option>
                  <option value="AB-">FACT AB-NEGATIVO (AB-)</option>
                </select>
              </div>

              {/* Jerarquía selection edit entry */}
              <div className="flex flex-col gap-1.5 font-sans">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jerarquía</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-slate-950/85 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-xs text-slate-200 transition-all outline-none h-9 cursor-pointer font-medium"
                >
                  {ROLES_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Submit / Cancel Area */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] tracking-wider uppercase py-2 px-4 rounded-xl border-0 cursor-pointer"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-650 hover:bg-indigo-550 text-white font-bold text-[10px] tracking-wider uppercase py-2 px-5 rounded-xl border-0 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  Guardar Cambios
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Stats Bento Grid on Right-Hand Side (Dynamic values & fully consistent) */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          {/* Stat 1: Años de servicio */}
          <div className="bg-[#0f172a]/20 border border-slate-800/70 rounded-2xl p-5 flex flex-col justify-center shadow-md backdrop-blur-sm">
            <span className="text-[10px] font-extrabold text-slate-450 uppercase flex items-center gap-2 mb-2 tracking-widest">
              <Shield className="w-4 h-4 text-indigo-400 shrink-0" /> Años de Servicio
            </span>
            <span className="text-4xl font-extrabold font-mono text-slate-100 leading-tight">
              {calculatedYearsOfService}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold mt-1">Sujeto a normas ministeriales</span>
          </div>

          {/* Stat 2: Servicios Atendidos (Absolute Consistency with Database!) */}
          <div className="bg-[#0f172a]/20 border border-[#b91c1c]/25 rounded-2xl p-5 flex flex-col justify-center shadow-md backdrop-blur-sm">
            <span className="text-[10px] font-extrabold text-rose-400 uppercase flex items-center gap-2 mb-2 tracking-widest">
              <Flame className="w-4 h-4 text-rose-500 shrink-0" /> Servicios Atendidos
            </span>
            <span className="text-4xl font-extrabold font-mono text-slate-100 leading-tight">
              {userRecords.length}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold mt-1">Incidentes reales indexados</span>
          </div>

          {/* Stat 3: Condecoraciones y Cursos */}
          <div className="bg-[#0f172a]/20 border border-slate-800/70 rounded-2xl p-5 flex flex-col justify-center shadow-md backdrop-blur-sm">
            <span className="text-[10px] font-extrabold text-slate-450 uppercase flex items-center gap-2 mb-2 tracking-widest">
              <Award className="w-4 h-4 text-indigo-400 shrink-0" /> Condecoraciones
            </span>
            <span className="text-4xl font-extrabold font-mono text-slate-100 leading-tight">
              {defaultCondecoraciones}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold mt-1">Por valor y antigüedad</span>
          </div>

          {/* Current Assignment Banner Card spanning bottom cols — Editable */}
          <div className="bg-indigo-950/10 border border-indigo-900/30 rounded-2xl p-5 col-span-1 sm:col-span-3 flex items-start gap-4.5 shadow-md">
            <div className="w-12 h-12 rounded-xl bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1.5">
                <h3 className="font-extrabold text-slate-200 text-sm uppercase tracking-wide">Asignación Operativa Activa</h3>
                <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider bg-indigo-950/40 border border-indigo-900/50 px-2 py-0.5 rounded-full">Editable</span>
              </div>
              <textarea
                value={editableAssignment}
                onChange={(e) => setEditableAssignment(e.target.value)}
                rows={3}
                className="w-full bg-transparent text-slate-400 text-xs leading-relaxed font-semibold resize-none outline-none border border-transparent focus:border-indigo-700/50 focus:bg-indigo-950/20 rounded-lg px-2 py-1 transition-all placeholder-slate-600"
                placeholder="Ingrese la asignación operativa del oficial..."
              />
              <p className="text-[9px] text-slate-600 mt-0.5">Haz clic sobre el texto para editarlo. Se imprimirá tal como está escrito.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Chronological History Timeline */}
      <div className="mt-8">
        
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-2">
          <h3 className="font-extrabold text-slate-100 font-sans text-sm uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-455" />
            Expediente Administrativo y Académico
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-550 text-white rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors shadow-md outline-none border-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-200" />
            {showAddForm ? "Cancelar Ingreso" : "Registrar Log Histórico"}
          </button>
        </div>

        {/* Dynamic New Milestone Form */}
        {showAddForm && (
          <div className="mb-8 p-5 bg-[#0f172a]/30 border border-slate-800/80 rounded-2xl shadow-xl animate-fade-in max-w-2xl font-sans text-slate-200">
            <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-4">Ingresar Nuevo Log Histórico de Servicio o Curso</h4>
            <form onSubmit={handleMilestoneSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Registro</label>
                  <select
                    value={newMilestone.type}
                    onChange={(e) => setNewMilestone(prev => ({ ...prev, type: e.target.value as MilestoneType }))}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs focus:border-indigo-505 outline-none h-9 font-semibold text-slate-300 cursor-pointer"
                  >
                    <option value="Certification" className="bg-[#020617]">Acreditación / Curso Académico</option>
                    <option value="Promotion" className="bg-[#020617]">Ascenso Militar/Jerárquico</option>
                    <option value="Commendation" className="bg-[#020617]">Condecoración por Valor</option>
                    <option value="Onboarding" className="bg-[#020617]">Ingreso Inicial de Contratación</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha del Suceso</label>
                  <input
                    type="date"
                    value={newMilestone.date}
                    onChange={(e) => setNewMilestone(prev => ({ ...prev, date: e.target.value }))}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs focus:border-indigo-550 outline-none h-9 text-slate-200"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Título de la Acreditación / Sello</label>
                <input
                  type="text"
                  placeholder="Ej. Curso Práctico de Combate de Incendios Clase B"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs focus:border-indigo-550 outline-none text-slate-100 placeholder-slate-705"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripción Técnica</label>
                <textarea
                  placeholder="Detalles técnicos, institución emisora y código de resolución o número de folio..."
                  rows={2}
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs focus:border-indigo-550 outline-none text-slate-200 placeholder-slate-705 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-805">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border-0 bg-slate-800 text-slate-300 text-[10px] font-bold uppercase rounded-xl hover:bg-slate-700 cursor-pointer"
                >
                  Descartar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 border-0 bg-indigo-650 text-white text-[10px] font-bold uppercase rounded-xl hover:bg-indigo-550 cursor-pointer shadow-md"
                >
                  Guardar Log
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Timeline Structure comprising both manual logs and direct incident reports */}
        {timelineEvents.length === 0 ? (
          <div className="p-12 text-center text-slate-450 border border-dashed border-slate-800/80 rounded-2xl">
            No hay registros históricos ni servicios de emergencia indexados en este expediente de oficial.
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-800/50">
            {timelineEvents.map((event, idx) => {
              const eventBadge = getEventBadge(event);
              return (
                <div 
                  key={event.id} 
                  className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group`}
                >
                  {/* Circle Icon Badge */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-lg z-10 ${getEventIconBgClass(event)}`}>
                    {getEventIcon(event)}
                  </div>

                  {/* Text card panel */}
                  <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-[#0f172a]/20 border border-slate-800/80 p-5 rounded-2xl shadow-md hover:shadow-xl hover:bg-[#0f172a]/30 transition-all duration-200 relative">
                    
                    {/* Delete button (Only show for manually added milestones logs) */}
                    {event.category !== 'Incident' && (
                      <button
                        onClick={() => onDeleteMilestone(event.originalId)}
                        className="absolute top-4 right-4 text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-slate-900 cursor-pointer border-0"
                        title="Eliminar registro histórico"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Official checkmark identifier for active emergency response service records */}
                    {event.category === 'Incident' && (
                      <div className="absolute top-4 right-4 flex items-center gap-1 text-slate-550" title="Incidente oficial indexado">
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-2.5">
                      {event.category !== 'Incident' ? (
                        <span className={`text-[9px] font-extrabold uppercase py-0.5 px-2 rounded-lg border ${eventBadge.classes}`}>
                          {eventBadge.text}
                        </span>
                      ) : (
                        <span />
                      )}
                      <span className="font-mono text-xs text-slate-500 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-600" />
                        {event.date}
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-200 leading-tight pr-14">{event.title}</h4>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed font-semibold">{event.description}</p>
                    {event.status && (
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Estado de Trámite: {event.status === 'Completed' ? 'Verificado / Procesado' : 'Pendiente revisión'}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>

    {/* Absolute Print Modal overlay for Iframe safety navigation */}
    {showPrintModal && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in print:hidden">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
          <button 
            onClick={() => setShowPrintModal(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700/30"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-150 text-base">Instrucciones de Impresión de Expediente</h3>
              <p className="text-xs text-slate-400">Guía de impresión oficial / Respaldado en PDF</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs leading-relaxed text-slate-300">
            <div className="font-semibold text-amber-300 flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl">
              <span className="text-base select-none">⚠️</span>
              <p>
                <span className="font-bold text-amber-200">Seguridad del Navegador en Vista Previa:</span> Estás visualizando la aplicación en un entorno de desarrollo integrado (Iframe). Por seguridad, los navegadores impiden que frames interactivos ejecuten directamente la ventana de impresión física.
              </p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl space-y-2.5">
              <p className="text-[11px] uppercase tracking-widest text-[#818cf8] font-extrabold font-mono">Para Imprimir o Guardar en PDF de Forma Exitosa:</p>
              <ol className="list-decimal list-inside space-y-2 pl-1.5 text-slate-305">
                <li>
                  Haz clic en el botón <strong className="text-slate-100 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] inline-flex items-center gap-1"><ExternalLink className="w-3 h-3 text-[#818cf8]" /> Abrir en nueva pestaña</strong> situado en la esquina derecha del navegador de vista interactivo.
                </li>
                <li>
                  Navega hacia la pestaña de <strong className="text-slate-105">Expediente</strong> de tu perfil activo de Bombero.
                </li>
                <li>
                  Haz clic en <strong className="text-slate-105">Imprimir Expediente</strong>. ¡Ya puedes guardarlo como PDF o imprimir física y ordenadamente!
                </li>
              </ol>
            </div>

            <p className="text-slate-400">
              Mientras tanto, puedes presionar <strong className="text-indigo-400">Previsualizar Hoja</strong> para examinar, seleccionar o copiar todo tu expediente militar formateado perfectamente para papel directamente en pantalla.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-end gap-3">
            <button 
              onClick={() => {
                setShowPrintModal(false);
                setShowDraftMode(true);
                setTimeout(() => {
                  document.getElementById('printable-expediente')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 text-xs font-bold transition-all cursor-pointer border border-slate-800"
            >
              Previsualizar en Pantalla
            </button>
            <button 
              onClick={() => setShowPrintModal(false)}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-all shadow-md cursor-pointer border border-indigo-550"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Printable Expediente Document wrapper (completely hidden on screen view unless draft preview is active, structured for print layouts) */}
    <div 
      id="printable-expediente" 
      className={`${showDraftMode ? 'block max-w-4xl mx-auto mt-8 mb-20 p-6 md:p-12 bg-white text-black border-4 border-slate-705 rounded-2xl shadow-2xl overflow-x-auto ring-8 ring-slate-950/15 animate-fade-in' : 'hidden'} print:block w-full text-black bg-white select-text`}
    >
      <div className="w-full bg-white relative">
        {/* Helper Badge indicating Draft mode for on-screen user layout review */}
        {showDraftMode && (
          <div className="mb-4 no-print flex items-center justify-between bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-xs text-indigo-900 select-none">
            <div className="flex items-center gap-1.5 font-semibold">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              Modo de Vista Previa de Impresión Activo (Hoja Física A4)
            </div>
            <button 
              onClick={() => setShowDraftMode(false)}
              className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer bg-transparent border-0"
            >
              Cerrar Previsualización
            </button>
          </div>
        )}
          
          {/* Header Banner */}
          <div className="text-center border-b-2 border-black pb-4 mb-6 relative">
            <div className="flex justify-between items-center px-4">
              <div className="text-left font-serif text-[10px] leading-tight text-slate-800">
                <p className="font-bold">REPÚBLICA BOLIVARIANA DE VENEZUELA</p>
                <p>MINISTERIO DEL PODER POPULAR PARA RELACIONES INTERIORES</p>
                <p>CUERPO DE BOMBEROS VOLUNTARIOS - UNIVERSIDAD SANTA MARÍA</p>
                <p>DIVISIÓN DE TALENTO HUMANO Y OPERACIONES</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full border-2 border-black flex items-center justify-center font-serif text-[5px] font-bold text-center p-1 leading-none shadow-sm">
                  USM<br/>SELLO
                </div>
              </div>
            </div>

            <h2 className="text-xl font-serif font-bold tracking-wider text-black mt-6 mb-1 uppercase">
              Expediente de Vida Laboral y Registro Operativo de Bomberos
            </h2>
            <p className="text-[10px] font-mono tracking-widest text-slate-600 font-bold">
              CÓDIGO DE REGISTRO INTEGRADO: REG-{userCedulaId.replace(/\D/g, '')}
            </p>
          </div>

          {/* Profile & Vital Data Section */}
          <div className="flex gap-6 mb-6">
            
            {/* Foto Carnet on Print */}
            <div className="w-28 h-36 border-2 border-black shrink-0 flex flex-col items-center justify-center p-1 bg-white">
              {userPhoto ? (
                <img 
                  alt="Foto del Funcionario" 
                  className="w-full h-full object-cover" 
                  src={userPhoto}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  id="pdf-photo-placeholder"
                  style={{ backgroundColor: '#f1f5f9', border: '1px dashed #94a3b8' }}
                  className="w-full h-full flex flex-col items-center justify-center text-center p-1.5"
                >
                  {/* Plain text fallback — no SVG icon to avoid black-box rendering in PDF */}
                  <p style={{ color: '#64748b' }} className="text-[9px] leading-snug font-bold uppercase">SIN FOTO</p>
                  <p style={{ color: '#94a3b8' }} className="text-[8px] leading-snug font-bold uppercase">CARNET</p>
                </div>
              )}
            </div>

            {/* Official Table Grid of Personal Specs */}
            <div className="flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <tbody>
                  <tr className="border-b border-black">
                    <th className="py-1.5 font-bold uppercase text-[10px] text-slate-700 w-1/3">Nombre Completo:</th>
                    <td className="py-1.5 font-semibold text-black uppercase">{userFullName}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <th className="py-1.5 font-bold uppercase text-[10px] text-slate-700">Cédula de Identidad:</th>
                    <td className="py-1.5 font-mono text-black font-bold">{userCedulaId}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <th className="py-1.5 font-bold uppercase text-[10px] text-slate-700">Jerarquía:</th>
                    <td className="py-1.5 font-semibold text-black uppercase">{userRoleStr}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <th className="py-1.5 font-bold uppercase text-[10px] text-slate-700">Adscripción / Escuadra:</th>
                    <td className="py-1.5 text-black">Escuadra Operativa del Cuerpo de USM</td>
                  </tr>
                  <tr className="border-b border-black">
                    <th className="py-1.5 font-bold uppercase text-[10px] text-slate-700">Grupo Sanguíneo:</th>
                    <td className="py-1.5 font-mono text-black font-bold">{userBlood}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <th className="py-1.5 font-bold uppercase text-[10px] text-slate-700">Años de Servicio:</th>
                    <td className="py-1.5 font-mono text-black font-bold">{calculatedYearsOfService} Años</td>
                  </tr>
                  <tr className="border-b border-black">
                    <th className="py-1.5 font-bold uppercase text-[10px] text-slate-700">Condecoraciones / Hitos:</th>
                    <td className="py-1.5 font-mono text-black font-bold">{defaultCondecoraciones} Registrados</td>
                  </tr>
                  <tr>
                    <th className="py-1.5 font-bold uppercase text-[10px] text-slate-700">Servicios Atendidos:</th>
                    <td className="py-1.5 font-mono text-black font-bold">{userRecords.length} Operativos</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* Section: Resumen de Desempeño */}
          <div
            id="pdf-assignment-box"
            style={{ backgroundColor: '#f8fafc', border: '1px solid #000000', color: '#000000' }}
            className="mb-6 p-3"
          >
            <h3 style={{ color: '#000000', borderBottom: '1px solid #000000', paddingBottom: '4px', marginBottom: '6px' }} className="text-xs font-bold uppercase tracking-tight">
              I. RESUMEN DE ASIGNACIÓN Y RESPONSABILIDADES
            </h3>
            <p style={{ color: '#1e293b' }} className="text-[11px] leading-relaxed text-justify">
              {editableAssignment || defaultAssignment}
            </p>
          </div>

          {/* Section: Hitos Académicos, Condecoraciones y Ascensos */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase mb-2 tracking-tight border-b-2 border-black pb-1">
              II. HITOS ACADÉMICOS, ASCENSOS Y CONDECORACIONES DE HONOR
            </h3>
            {userMilestones.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic p-1">No se registran hitos académicos ni condecoraciones en este expediente público militar.</p>
            ) : (
              <table className="w-full text-left text-[10px] border-collapse bg-white">
                <thead>
                  <tr className="border-b-2 border-black bg-slate-100 uppercase font-mono font-bold">
                    <th className="py-1.5 px-2 w-1/4">Fecha</th>
                    <th className="py-1.5 px-2 w-1/4">Acción / Tipo</th>
                    <th className="py-1.5 px-2">Título de Reconocimiento y Resumen del Hito</th>
                  </tr>
                </thead>
                <tbody>
                  {userMilestones.map((m) => (
                    <tr key={m.id} className="border-b border-slate-300">
                      <td className="py-2 px-2 font-mono font-semibold">{m.date}</td>
                      <td className="py-2 px-2 uppercase font-mono font-bold text-slate-700">
                        {m.type === 'Promotion' ? 'Ascenso' : m.type === 'Certification' ? 'Certificación' : 'Honor/Condecoración'}
                      </td>
                      <td className="py-2 px-2">
                        <p className="font-bold">{m.title}</p>
                        <p className="text-[9px] text-slate-600 mt-0.5">{m.description}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Section: Servicios Operativos Atendidos */}
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase mb-2 tracking-tight border-b-2 border-black pb-1">
              III. REGISTRO OFICIAL DE SERVICIOS Y EMERGENCIAS ATENDIDAS
            </h3>
            {userRecords.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic p-1">No se registran salidas operativas ni atención de incidentes reportados en la bitácora activa para este oficial.</p>
            ) : (
              <table className="w-full text-left text-[10px] border-collapse bg-white border-b border-black">
                <thead>
                  <tr className="border-b-2 border-black bg-slate-100 uppercase font-mono font-bold">
                    <th className="py-1.5 px-2 w-1/4">Fecha Operativo</th>
                    <th className="py-1.5 px-2 w-1/4">Clase de Incidente</th>
                    <th className="py-1.5 px-2">Resumen Detallado del Servicio de Emergencia</th>
                  </tr>
                </thead>
                <tbody>
                  {userRecords.map((r) => (
                    <tr key={r.id} className="border-b border-slate-300">
                      <td className="py-2 px-2 font-mono font-semibold">{r.serviceDate || r.timestamp?.substring(0, 10)}</td>
                      <td className="py-2 px-2 font-bold uppercase text-slate-700">{r.serviceType}</td>
                      <td className="py-2 px-2 text-justify">
                        <p className="font-semibold leading-tight">{r.summary}</p>
                        <p className="text-[9px] text-slate-600 mt-0.5 font-mono"><strong className="font-semibold">Unidad de Respuesta:</strong> Estación Central USM • <strong className="font-semibold">Estatus del Servicio:</strong> Validado / Concluido</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Firmas Autorizadas / Fin del Expediente */}
          <div className="mt-12 pt-8 border-t border-slate-400">
            <p className="text-center text-[9px] text-slate-500 font-mono tracking-wider uppercase mb-8 leading-relaxed">
              SISTEMA AUTOMATIZADO DE HISTORIAL OPERATIVO Y HOJA DE VIDA DE BOMBEROS<br/>
              DOCUMENTO EMITIDO EL {printableEmittedDate.toUpperCase()} PARA EFECTOS DE EXPEDIENTE LABORAL COMPROMETIDO.
            </p>
            
            <div className="grid grid-cols-2 gap-12 mt-12 px-6">
              <div className="text-center flex flex-col items-center">
                <div className="border-t border-black w-48 mt-8 pt-1.5">
                  <p className="text-[9px] font-bold uppercase text-black">{userFullName}</p>
                  <p className="text-[8px] font-mono text-slate-600">C.I.: {userCedulaId}</p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">FIRMA DEL OFICIAL ADSCRITO</p>
                </div>
              </div>

              <div className="text-center flex flex-col items-center">
                <div className="border-t border-black w-48 mt-8 pt-1.5">
                  <p className="text-[9px] font-bold uppercase text-black">JEFATURA DE PERSONAL USM</p>
                  <p className="text-[8px] text-slate-600">Comando General USM</p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">FIRMA Y SELLO DE LA COMANDANCIA</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
