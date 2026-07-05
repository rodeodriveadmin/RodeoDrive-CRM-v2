// Strings owned by the drive cluster.

export const driveEn = {
  "drive.title": "Drive",
  "drive.upload": "Upload file",
  "drive.file": "File",
  "drive.folder": "Folder",
  "drive.size": "Size",
  "drive.owner": "Owner",
  "drive.visibility": "Visibility",
  "drive.visibility.PRIVATE": "Private",
  "drive.visibility.ORGANIZATION": "Organization",
  "drive.none": "No files yet",
  "drive.download": "Download",
  "drive.tooLarge": "File is too large (max 15 MB)",
  "drive.allFolders": "All folders",
} as const;

export const driveAr: Record<keyof typeof driveEn, string> = {
  "drive.title": "الملفات",
  "drive.upload": "رفع ملف",
  "drive.file": "الملف",
  "drive.folder": "المجلد",
  "drive.size": "الحجم",
  "drive.owner": "المالك",
  "drive.visibility": "الظهور",
  "drive.visibility.PRIVATE": "خاص",
  "drive.visibility.ORGANIZATION": "المؤسسة",
  "drive.none": "لا توجد ملفات بعد",
  "drive.download": "تنزيل",
  "drive.tooLarge": "الملف كبير جداً (الحد ١٥ م.ب)",
  "drive.allFolders": "كل المجلدات",
};
