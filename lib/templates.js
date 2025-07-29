import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Progress callback type: (current, total, filename) => void
let progressCallback = null;

/**
 * Set the progress callback for file operations
 * @param {Function} callback - Progress callback function
 */
export function setProgressCallback(callback) {
  progressCallback = callback;
}

/**
 * Count files in a directory recursively
 * @param {string} dir - Directory to count files in
 * @returns {number} Total file count
 */
async function countFiles(dir) {
  let count = 0;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      count += await countFiles(path.join(dir, entry.name));
    } else {
      count++;
    }
  }
  
  return count;
}

/**
 * Copy template files from source to destination
 * @param {string} templateDir - Source template directory
 * @param {string} destDir - Destination directory
 * @param {Object} variables - Variables to replace in templates
 * @param {number} totalFiles - Total number of files (for progress)
 * @param {Object} progress - Progress tracking object
 */
export async function copyTemplate(templateDir, destDir, variables = {}, totalFiles = 0, progress = { current: 0 }) {
  const entries = await fs.readdir(templateDir, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(templateDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    
    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      await copyTemplate(srcPath, destPath, variables, totalFiles, progress);
    } else {
      let content = await fs.readFile(srcPath, "utf8");
      
      // Replace variables
      for (const [key, value] of Object.entries(variables)) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
      
      await fs.writeFile(destPath, content);
      
      // Update progress
      progress.current++;
      if (progressCallback && totalFiles > 0) {
        progressCallback(progress.current, totalFiles, entry.name);
      }
    }
  }
}

/**
 * Apply a template layer (base, auth-google, auth-password)
 * @param {string} layer - Template layer name
 * @param {string} projectRoot - Project root directory
 * @param {Object} variables - Variables to replace
 * @param {Object} options - Options for template application
 */
export async function applyTemplateLayer(layer, projectRoot, variables = {}, options = {}) {
  const templateRoot = path.join(__dirname, "..", "templates", layer);
  const { skipBackend = false, skipFrontend = false, showProgress = false } = options;
  
  // Check if template exists
  try {
    await fs.access(templateRoot);
  } catch {
    throw new Error(`Template layer "${layer}" not found`);
  }
  
  // Count total files if showing progress
  let totalFiles = 0;
  const progress = { current: 0 };
  
  if (showProgress) {
    if (!skipFrontend) {
      const frontendTemplate = path.join(templateRoot, "frontend");
      try {
        await fs.access(frontendTemplate);
        totalFiles += await countFiles(frontendTemplate);
      } catch {}
    }
    
    if (!skipBackend) {
      const backendTemplate = path.join(templateRoot, "backend");
      try {
        await fs.access(backendTemplate);
        totalFiles += await countFiles(backendTemplate);
      } catch {}
    }
  }
  
  // Copy frontend templates if they exist and not skipped
  if (!skipFrontend) {
    const frontendTemplate = path.join(templateRoot, "frontend");
    try {
      await fs.access(frontendTemplate);
      await copyTemplate(frontendTemplate, path.join(projectRoot, "frontend"), variables, totalFiles, progress);
    } catch {
      // No frontend templates in this layer
    }
  }
  
  // Copy backend templates if they exist and not skipped
  if (!skipBackend) {
    const backendTemplate = path.join(templateRoot, "backend");
    try {
      await fs.access(backendTemplate);
      await copyTemplate(backendTemplate, path.join(projectRoot, "backend"), variables, totalFiles, progress);
    } catch {
      // No backend templates in this layer
    }
  }
}

/**
 * Get CLAUDE.md content for the specified configuration
 * @param {string} projectName - Project name
 * @param {boolean} withAuth - Whether auth is enabled
 * @param {boolean} withPasswordAuth - Whether password auth is enabled
 * @returns {string} CLAUDE.md content
 */
export async function getClaudeMdContent(projectName, withAuth, withPasswordAuth) {
  const templateRoot = path.join(__dirname, "..", "templates", "CLAUDE.md.templates");
  
  let templateFile = "base.md";
  if (withAuth) {
    templateFile = withPasswordAuth ? "auth-password.md" : "auth-google.md";
  }
  
  const templatePath = path.join(templateRoot, templateFile);
  let content = await fs.readFile(templatePath, "utf8");
  
  // Replace variables
  content = content.replace(/{{PROJECT_NAME}}/g, projectName);
  
  return content;
}