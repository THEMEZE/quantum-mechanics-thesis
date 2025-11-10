import subprocess
import os

def compile_latex(dir_path, main_tex="cv.tex"):
    """
    Compile a LaTeX project with a .bib bibliography using pdflatex + biber.
    
    Args:
        dir_path (str): Path to the LaTeX project directory.
        main_tex (str): Main .tex filename (default: cv.tex)
    """
    # Change working directory
    cwd = os.getcwd()
    os.chdir(dir_path)
    
    try:
        print("Step 1: pdflatex (first pass)...")
        result = subprocess.run(["xelatex", "-interaction=nonstopmode", main_tex],
                        capture_output=True, text=True)
        print(result.stdout)
        print(result.stderr)
        
        print("Step 2: biber...")
        base_name = os.path.splitext(main_tex)[0]
        result =subprocess.run(["biber", base_name], check=True)
        print(result.stdout)
        print(result.stderr)
        
        print("Step 3: pdflatex (second pass)...")
        result = subprocess.run(["xelatex", "-interaction=nonstopmode", main_tex],
                        capture_output=True, text=True)
        print(result.stdout)
        print(result.stderr)
        
        print("Step 4: pdflatex (final pass)...")
        result = subprocess.run(["xelatex", "-interaction=nonstopmode", main_tex],
                        capture_output=True, text=True)
        print(result.stdout)
        print(result.stderr)
        
        print(f"Compilation finished! PDF is located at: {os.path.join(dir_path, base_name + '.pdf')}")
    
    except subprocess.CalledProcessError as e:
        print("Error during compilation:", e)
    
    finally:
        # Restore original working directory
        os.chdir(cwd)

compile_latex("./", "CVModern_2.tex")

compile_latex("./", "CVModern_5.tex")
