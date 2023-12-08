local pywal = require('pywal')

pywal.setup()

-- Remove background color for Normal
vim.cmd("highlight Normal guibg=NONE ctermbg=NONE")

-- Remove background color for NormalFloat
vim.cmd("highlight NormalFloat guibg=NONE ctermbg=NONE")

-- Remove background color for LineNr
vim.cmd("highlight LineNr guibg=NONE ctermbg=NONE")

-- Remove background color for the sign column (left of line numbers)
vim.cmd("highlight SignColumn guibg=NONE ctermbg=NONE")
