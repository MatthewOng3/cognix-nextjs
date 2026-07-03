import { Pinecone } from '@pinecone-database/pinecone';
import { envConfig } from '../util/env-config';

const TEMPLATE_NAMESPACE = "project_template_base_files";
const TEMPLATE_PROJECT_ID = "project_template_namespace";

interface VectorMetadata {
    project_id: string;
    file_path: string;
    embedding_text: string;
    purpose: string;
    features: string[];
    keywords: string[];
    defined_symbols: string[];
    dependencies: string[];
  }
  
  interface TemplateVector {
    id: string;
    values: number[];
    metadata: VectorMetadata;
  }

/**
 * Copy template vectors from template namespace to new project namespace using Pinecone SDK
 */
export async function copyTemplateVectorsToProject(
  userId: string,
  projectId: string
): Promise<boolean> {
  try {
    console.log(`[CopyVectors] Copying template vectors to project ${projectId}`);
    
    // Initialize Pinecone client
    const pinecone = new Pinecone({
      apiKey: envConfig.pineconeApiKey,
    });
    
    // Get the index
    const index = pinecone.index('project-code-files');
    
    // ════════════════════════════════════════════════════════════════
    // STEP 1: Fetch template vectors using query with dummy vector
    // ════════════════════════════════════════════════════════════════
    
    const templateNamespace = index.namespace(TEMPLATE_NAMESPACE);
    
    // Query with dummy vector to get all records
    const queryResponse = await templateNamespace.query({
      vector: new Array(1024).fill(0), // Dummy vector (match your embedding dimension)
      topK: 10000, // Max records to fetch
      includeMetadata: true,
      includeValues: true, // ✅ Important: need the actual embeddings
      filter: {
        project_id: { $eq: TEMPLATE_PROJECT_ID }
      }
    });

    const templateVectors = queryResponse.matches || [];

    if (templateVectors.length === 0) {
      console.warn('[CopyVectors] No template vectors found!');
      return false;
    }

    console.log(`[CopyVectors] Found ${templateVectors.length} template vectors`);

    // ════════════════════════════════════════════════════════════════
    // STEP 2: Transform vectors for new project
    // ════════════════════════════════════════════════════════════════
    
    const newRecords = templateVectors.map((vector) => {
      if (!vector.values || !vector.metadata) {
        throw new Error('Vector missing values or metadata');
      }
      const metadata = vector.metadata as unknown as VectorMetadata;
      const file_path = metadata.file_path;

      // ✅ Reconstruct embedding_text to match your Python format
      const embedding_text = 
        `File: ${file_path}\n` +
        `Purpose: ${metadata.purpose}\n` +
        `Features: ${metadata.features.join(', ')}\n` +
        `Keywords: ${metadata.keywords.join(', ')}\n` +
        `Defined Symbols: ${metadata.defined_symbols.join(', ')}\n` +
        `Dependencies: ${metadata.dependencies.join(', ')}\n`;

      return {
        id: `${projectId}_${file_path}`,
        values: vector.values, // Keep same embeddings
        metadata: {
          project_id: projectId,           // ✅ New project ID
          file_path: file_path,            // ✅ Keep file path
          embedding_text: embedding_text,  // ✅ Regenerated embedding text
          purpose: metadata.purpose,
          features: metadata.features,
          keywords: metadata.keywords,
          defined_symbols: metadata.defined_symbols,
          dependencies: metadata.dependencies,
        }
      };
    });

    // ════════════════════════════════════════════════════════════════
    // STEP 3: Upsert to user's namespace in batches
    // ════════════════════════════════════════════════════════════════
    
    const userNamespace = index.namespace(userId);
    const BATCH_SIZE = 100; // Pinecone recommends batches of 100-200
    
    for (let i = 0; i < newRecords.length; i += BATCH_SIZE) {
      const batch = newRecords.slice(i, i + BATCH_SIZE);
      
      await userNamespace.upsert(batch);
      
      console.log(
        `[CopyVectors] Upserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(newRecords.length / BATCH_SIZE)}`
      );
    }

    console.log(`[CopyVectors] ✓ Successfully copied ${newRecords.length} vectors to project ${projectId}`);
    return true;

  } catch (error) {
    console.error(`[CopyVectors] Error copying template vectors:`, error);
    return false;
  }
}
