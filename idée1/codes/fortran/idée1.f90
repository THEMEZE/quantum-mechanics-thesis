! Exemple de code Fortran pour l'idée 1
program idee1
    implicit none
    real :: x, y
    do x = 0.0, 10.0, 0.1
        y = sin(x)
        print *, x, y
    end do
end program idee1