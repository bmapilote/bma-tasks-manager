"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

const PROMPT = `Tu es un assistant de développement spécialisé dans l'analyse de projets.

Analyse le projet en cours et génère un fichier JSON au format suivant pour importer les tâches dans BMA Task Manager :

\`\`\`json
{
  "version": 1,
  "exportedAt": "2026-06-05T10:00:00.000Z",
  "project": {
    "name": "Nom du projet",
    "description": "Description du projet",
    "color": "#3b82f6"
  },
  "completedTasks": [
    {
      "title": "Authentification utilisateur",
      "description": "Mise en place du système de connexion",
      "priority": "HIGH",
      "subtasks": [
        { "title": "Page de login", "completed": true },
        { "title": "Page d'inscription", "completed": true },
        { "title": "Réinitialisation de mot de passe", "completed": false }
      ]
    }
  ],
  "upcomingTasks": [
    {
      "title": "Tableau de bord",
      "description": "Créer la page d'accueil après connexion",
      "priority": "HIGH",
      "dueDate": null,
      "estimatedHours": null,
      "subtasks": [
        { "title": "Widget statistiques", "completed": false },
        { "title": "Notifications récentes", "completed": false }
      ]
    }
  ]
}
\`\`\`

Règles :
- \`completedTasks\` : liste toutes les tâches et sous-tâches déjà finalisées dans le projet
- \`upcomingTasks\` : propose une liste de tâches pertinentes à venir pour la suite du développement
- Les priorités valides sont : LOW, MEDIUM, HIGH, URGENT
- Ne pas inclure d'IDs, dates ou métadonnées internes
- Le fichier doit être valide JSON
- Réponse uniquement le fichier JSON, rien d'autre`;

export function UniversalPrompt() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Prompt universel</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            À coller dans votre assistant IA (Cursor, Claude, ChatGPT...) pour générer un fichier
            JSON compatible avec l&apos;importation de projets.
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              Copié
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copier
            </>
          )}
        </button>
      </div>
      <pre className="max-h-80 overflow-auto rounded-lg bg-muted p-4 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap font-mono">
        {PROMPT}
      </pre>
    </div>
  );
}
