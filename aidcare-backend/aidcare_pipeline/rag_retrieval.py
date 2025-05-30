# aidcare_pipeline/rag_retrieval.py
import json
import os
import faiss
import numpy as np # faiss returns numpy arrays for distances and indices
from sentence_transformers import SentenceTransformer

# --- Configuration for Model Name (can be overridden by environment variable) ---
EMBEDDING_MODEL_NAME_RAG = os.getenv("EMBEDDING_MODEL_RAG", 'all-MiniLM-L6-v2')

# --- Path Definitions ---
# Determine the project root directory based on the location of this file
# This assumes rag_retrieval.py is in aidcare_pipeline/, which is in aidcare-backend/
_PIPELINE_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_PIPELINE_DIR) # This should resolve to your 'aidcare-backend' root

# Default paths for CHW Knowledge Base files
DEFAULT_CHW_INDEX_PATH = os.path.join(_PROJECT_ROOT, "data", "kb_chw", "chw_guidelines_index.faiss")
DEFAULT_CHW_METADATA_PATH = os.path.join(_PROJECT_ROOT, "data", "kb_chw", "chw_guidelines_metadata.json")

# Default paths for Clinical Support Knowledge Base files
DEFAULT_CLINICAL_INDEX_PATH = os.path.join(_PROJECT_ROOT, "data", "kb_clinical", "clinical_kb_index.faiss")
DEFAULT_CLINICAL_METADATA_PATH = os.path.join(_PROJECT_ROOT, "data", "kb_clinical", "clinical_kb_metadata.json")


# --- RAG Retriever Class ---
class GuidelineRetriever:
    def __init__(self, index_path: str, metadata_path: str, model_name: str = EMBEDDING_MODEL_NAME_RAG):
        if not os.path.exists(index_path):
            raise FileNotFoundError(f"FAISS index file not found at: {index_path}")
        if not os.path.exists(metadata_path):
            raise FileNotFoundError(f"Metadata file not found at: {metadata_path}")

        print(f"GuidelineRetriever: Loading FAISS index from: {index_path}")
        self.index = faiss.read_index(index_path)
        print(f"GuidelineRetriever: FAISS index loaded. Total vectors: {self.index.ntotal}")

        print(f"GuidelineRetriever: Loading metadata from: {metadata_path}")
        with open(metadata_path, 'r', encoding='utf-8') as f:
            self.metadata = json.load(f)
        print(f"GuidelineRetriever: Metadata loaded. Total entries: {len(self.metadata)}")

        if self.index.ntotal == 0:
            print(f"Warning: FAISS index at {index_path} is empty (0 vectors). Retrieval will not work.")
        elif self.index.ntotal != len(self.metadata):
            print(f"Warning: Mismatch! FAISS index ({self.index.ntotal} vectors) "
                  f"and metadata ({len(self.metadata)} entries) for paths: {index_path}, {metadata_path}")

        print(f"GuidelineRetriever: Loading sentence transformer model: {model_name}...")
        self.model = SentenceTransformer(model_name)
        print(f"GuidelineRetriever: Sentence transformer model '{model_name}' loaded.")

    def retrieve_relevant_guidelines(self, symptoms_list: list, top_k: int = 3) -> list:
        if not symptoms_list:
            print("GuidelineRetriever: Empty symptoms list provided. Cannot retrieve guidelines.")
            return []
        if self.index.ntotal == 0:
            print("GuidelineRetriever: FAISS index is empty. Cannot retrieve guidelines.")
            return []

        query_text = f"Patient symptoms: {', '.join(symptoms_list)}."
        # print(f"GuidelineRetriever: Constructed query for retrieval: \"{query_text}\"") # Can be verbose

        query_embedding = self.model.encode([query_text], convert_to_numpy=True)
        
        # print(f"GuidelineRetriever: Searching FAISS index for top {top_k} results...")
        distances, indices = self.index.search(query_embedding, k=min(top_k, self.index.ntotal)) # Ensure k is not > ntotal
        
        retrieved_entries = []
        if indices.size > 0:
            for i in range(indices.shape[1]): # Iterate through the number of results found for the query
                retrieved_idx = indices[0][i]
                if 0 <= retrieved_idx < len(self.metadata):
                    entry_metadata = self.metadata[retrieved_idx].copy() # Return a copy to avoid modifying cached metadata
                    entry_metadata['retrieval_score (distance)'] = float(distances[0][i])
                    retrieved_entries.append(entry_metadata)
                else:
                    print(f"GuidelineRetriever Warning: Retrieved index {retrieved_idx} is out of bounds for metadata (size {len(self.metadata)}).")
        
        # print(f"GuidelineRetriever: Retrieved {len(retrieved_entries)} guideline entries.")
        return retrieved_entries

# --- Global Instances for Singleton Pattern (loaded once per application lifecycle) ---
chw_retriever_instance: GuidelineRetriever | None = None
clinical_retriever_instance: GuidelineRetriever | None = None

def get_chw_retriever() -> GuidelineRetriever:
    global chw_retriever_instance
    if chw_retriever_instance is None:
        print("Initializing CHW GuidelineRetriever instance...")
        # Use environment variables for paths if set, otherwise use defaults
        idx_path = os.getenv("CHW_FAISS_INDEX_PATH", DEFAULT_CHW_INDEX_PATH)
        meta_path = os.getenv("CHW_METADATA_PATH", DEFAULT_CHW_METADATA_PATH)
        print(f"CHW Retriever will use index: {idx_path}, metadata: {meta_path}")
        chw_retriever_instance = GuidelineRetriever(index_path=idx_path, metadata_path=meta_path)
    return chw_retriever_instance

def get_clinical_retriever() -> GuidelineRetriever:
    global clinical_retriever_instance
    if clinical_retriever_instance is None:
        print("Initializing Clinical Support GuidelineRetriever instance...")
        idx_path = os.getenv("CLINICAL_FAISS_INDEX_PATH", DEFAULT_CLINICAL_INDEX_PATH)
        meta_path = os.getenv("CLINICAL_METADATA_PATH", DEFAULT_CLINICAL_METADATA_PATH)
        print(f"Clinical Retriever will use index: {idx_path}, metadata: {meta_path}")
        clinical_retriever_instance = GuidelineRetriever(index_path=idx_path, metadata_path=meta_path)
    return clinical_retriever_instance

# --- Example Usage (for testing this module directly) ---
if __name__ == "__main__":
    print("--- Testing RAG Retrieval Module ---")
    
    # Test CHW Retriever (assuming chw KB files exist)
    print("\n--- Testing CHW Retriever ---")
    try:
        chw_retriever = get_chw_retriever()
        if chw_retriever.index.ntotal > 0:
            test_symptoms_chw = ['fever', 'cough']
            print(f"Querying CHW KB with symptoms: {test_symptoms_chw}")
            results_chw = chw_retriever.retrieve_relevant_guidelines(test_symptoms_chw, top_k=2)
            for i, res in enumerate(results_chw):
                print(f"CHW Result {i+1}: Score {res.get('retrieval_score (distance)'):.4f} - Case: {res.get('case', 'N/A')} (Source: {res.get('source_document_name')})")
        else:
            print("CHW Retriever loaded but index is empty. Cannot test query.")
    except FileNotFoundError as e:
        print(f"Could not initialize CHW Retriever (files might be missing): {e}")
        print(f"Please run 'python scripts/prepare_chw_kb.py' first.")
    except Exception as e:
        print(f"Error testing CHW Retriever: {e}")

    # Test Clinical Retriever (assuming clinical KB files exist)
    print("\n--- Testing Clinical Retriever ---")
    try:
        clinical_retriever = get_clinical_retriever()
        if clinical_retriever.index.ntotal > 0:
            test_symptoms_clinical = ['chronic fatigue', 'weight loss', 'pallor']
            print(f"Querying Clinical KB with symptoms: {test_symptoms_clinical}")
            results_clinical = clinical_retriever.retrieve_relevant_guidelines(test_symptoms_clinical, top_k=2)
            for i, res in enumerate(results_clinical):
                print(f"Clinical Result {i+1}: Score {res.get('retrieval_score (distance)'):.4f} - Disease/Case: {res.get('disease_info', {}).get('disease', res.get('case', 'N/A'))} (Source: {res.get('source_document_name')})")
        else:
            print("Clinical Retriever loaded but index is empty. Cannot test query.")
    except FileNotFoundError as e:
        print(f"Could not initialize Clinical Retriever (files might be missing): {e}")
        print(f"Please run 'python scripts/prepare_clinical_kb.py' first.")
    except Exception as e:
        print(f"Error testing Clinical Retriever: {e}")

    print("\n--- RAG Retrieval Module Test Complete ---")