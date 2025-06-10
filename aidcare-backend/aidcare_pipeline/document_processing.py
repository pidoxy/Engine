import os
import shutil
import time 
from PIL import Image 
import pytesseract    
from pdf2image import convert_from_path, pdfinfo_from_path 
from sqlalchemy.orm import Session
from . import crud 
from datetime import datetime

# --- Configuration for Tesseract ---
TESSERACT_CMD_PATH = os.environ.get('TESSERACT_CMD_PATH')
if TESSERACT_CMD_PATH and os.path.exists(TESSERACT_CMD_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD_PATH
else:
    try:
        tesseract_version = pytesseract.get_tesseract_version()
        print(f"Tesseract OCR version {tesseract_version} found.")
    except pytesseract.TesseractNotFoundError:
        print("CRITICAL WARNING (document_processing.py): Tesseract OCR engine not found or not configured.")
        print("Ensure Tesseract OCR is installed and in your system PATH, or TESSERACT_CMD_PATH env var is set correctly.")
    except Exception as e:
        print(f"Warning: Issue checking Tesseract version: {e}")


# --- Helper OCR Functions ---
def perform_ocr_on_image(image_path: str) -> tuple[str | None, str | None]:
    """Performs OCR on an image file. Returns (extracted_text, error_message)."""
    try:
        print(f"OCR: Processing image: {image_path}")
        text = pytesseract.image_to_string(Image.open(image_path), lang='eng') 
        print(f"OCR: Success for image {image_path}. Text length: {len(text)}")
        return text, None
    except pytesseract.TesseractNotFoundError:
        err_msg = "Tesseract OCR engine not found or not configured."
        print(f"OCR Error (Image: {image_path}): {err_msg}")
        return None, err_msg
    except FileNotFoundError:
        err_msg = f"Image file not found at {image_path} for OCR."
        print(f"OCR Error: {err_msg}")
        return None, err_msg
    except Exception as e:
        import traceback
        err_msg = f"Generic error during OCR for image {os.path.basename(image_path)}: {str(e)}\nTraceback: {traceback.format_exc()}"
        print(f"OCR Error: {err_msg}")
        return None, err_msg

def perform_ocr_on_pdf(pdf_path: str) -> tuple[str | None, str | None]:
    """Performs OCR on a PDF file by converting pages to images. Returns (extracted_text, error_message)."""
    base_temp_dir = os.path.join(os.path.dirname(pdf_path), "ocr_temp_pages") # Store near PDF or choose another temp location
    os.makedirs(base_temp_dir, exist_ok=True)

    pdf_filename_base = os.path.splitext(os.path.basename(pdf_path))[0]
    # Unique temporary directory for this PDF's pages to avoid conflicts
    unique_page_image_dir = os.path.join(base_temp_dir, f"{pdf_filename_base}_{int(time.time() * 1000)}")
    
    try:
        print(f"OCR: Processing PDF: {pdf_path}")
        os.makedirs(unique_page_image_dir, exist_ok=True)
        
        images_paths = convert_from_path(pdf_path, output_folder=unique_page_image_dir, fmt='png', thread_count=os.cpu_count() or 1)
        
        if not images_paths:
            return None, "PDF conversion to images yielded no images (check PDF content/Poppler)."

        print(f"OCR: Converted PDF '{os.path.basename(pdf_path)}' to {len(images_paths)} images in {unique_page_image_dir}.")
        
        full_text_parts = []
        for i, image_file_path in enumerate(images_paths):
            print(f"  OCR: Processing page {i+1} from {image_file_path}...")
            page_text, ocr_error = perform_ocr_on_image(image_file_path) # Re-use image OCR function
            if ocr_error:
                print(f"  OCR Error on page {i+1}: {ocr_error}")
                full_text_parts.append(f"[OCR Error on page {i+1}: {ocr_error}]") # Include error in text
            elif page_text:
                full_text_parts.append(page_text)
        
        final_text = "\n\n--- Page Break ---\n\n".join(full_text_parts)
        print(f"OCR: Success for PDF {pdf_path}. Total text length: {len(final_text)}")
        return final_text, None
        
    except pytesseract.TesseractNotFoundError:
        err_msg = "Tesseract OCR engine not found or not configured."
        print(f"OCR Error (PDF: {pdf_path}): {err_msg}")
        return None, err_msg
    except Exception as e: 
        err_msg = f"Error during OCR/conversion for PDF {pdf_path}: {str(e)}"
        print(f"OCR Error: {err_msg}")
        return None, err_msg
    finally:
        if os.path.exists(unique_page_image_dir):
            try:
                shutil.rmtree(unique_page_image_dir)
            except Exception as e_clean:
                print(f"Error cleaning up temp PDF page directory {unique_page_image_dir}: {e_clean}")

# --- Main Background Task Function ---
def process_uploaded_document_task(
    db_provider: callable, 
    document_uuid: str, 
    file_path_on_server: str, 
    original_filename: str, 
    content_type: str
):
    db: Session = db_provider() 
    extracted_text: str | None = None
    status: str = "processing"
    error_detail: str | None = None
    
    try:
        print(f"BACKGROUND TASK: Starting processing for document UUID: {document_uuid}, File: {original_filename}")
        # crud.update_document_processing_status(db, document_uuid=document_uuid, status="processing")

        if not os.path.exists(file_path_on_server):
            final_error_message = f"File not found at path: {file_path_on_server}. Cannot process."
            final_status = "failed"
            print(f"BACKGROUND TASK ERROR: {final_error_message}")
        elif content_type in ["image/jpeg", "image/png", "image/tiff", "image/bmp", "image/gif"]:
            current_extracted_text, final_error_message = perform_ocr_on_image(file_path_on_server)
            if final_error_message:
                final_status = "failed"
            elif current_extracted_text is not None and not current_extracted_text.strip():
                final_status = "completed_empty_text"
            elif current_extracted_text is not None: # Has some text
                final_status = "completed"
            else: # Should not happen if perform_ocr_on_image is correct (returns text or error)
                final_status = "failed"
                final_error_message = "OCR returned unexpected None for text without error."

        elif content_type == "application/pdf":
            current_extracted_text, final_error_message = perform_ocr_on_pdf(file_path_on_server)
            if final_error_message:
                final_status = "failed"
            elif current_extracted_text is not None and not current_extracted_text.strip():
                final_status = "completed_empty_text"
            elif current_extracted_text is not None:
                final_status = "completed"
            else:
                final_status = "failed"
                final_error_message = "PDF OCR returned unexpected None for text without error."

        elif content_type == "text/plain":
            try:
                with open(file_path_on_server, 'r', encoding='utf-8', errors='ignore') as f:
                    current_extracted_text = f.read()
                final_status = "completed_empty_text" if not current_extracted_text.strip() else "completed"
            except Exception as e_txt:
                final_error_message = f"Error reading plain text file: {str(e_txt)}"
                final_status = "failed"
                print(f"BACKGROUND_TASK ERROR: {final_error_message}")
        else:
            final_error_message = f"Unsupported content type for text extraction: {content_type}"
            final_status = "failed"
            print(f"BACKGROUND_TASK: {final_error_message}")
        
        # One final update to the database
        crud.update_document_processing_status(
            db, 
            document_uuid=document_uuid, 
            status=final_status, 
            extracted_text=current_extracted_text, 
            error_msg=final_error_message
        )

        print(f"BACKGROUND TASK: Document {document_uuid} processing finished. Final Status: {status}. Text length: {len(extracted_text or '')}")

    except pytesseract.TesseractNotFoundError as e: # Catch this specifically if it bubbles up
        print(f"BACKGROUND TASK TESSERACT ERROR for doc {document_uuid}: {e}")
        final_error_message = "Tesseract OCR engine not found or not configured on the server."
        try:
            crud.update_document_processing_status(db, document_uuid, "failed", error_msg=final_error_message)
            # db.commit()
        except Exception as db_e: print(f"Failed to update DB with Tesseract error: {db_e}")
    except Exception as e:
        print(f"BACKGROUND TASK CRITICAL UNHANDLED ERROR for doc {document_uuid}: {e}")
        import traceback; traceback.print_exc()
        try:
            crud.update_document_processing_status(db, document_uuid, "failed", error_msg=f"Critical task error: {str(e)}")
            # db.commit()
        except Exception as db_e: print(f"Failed to update DB with critical task error: {db_e}")
    finally:
        db.close()