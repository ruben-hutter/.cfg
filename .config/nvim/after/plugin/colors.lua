function ColorMyPencils(color)
    color = color or "catppuccin-mocha"
    vim.cmd.colorscheme(color)

    -- Set transparent background for various elements
    vim.api.nvim_set_hl(0, "Normal", { bg = "none" })
    vim.api.nvim_set_hl(0, "NormalFloat", { bg = "none" })
    vim.api.nvim_set_hl(0, "LineNr", { bg = "none" })
    vim.api.nvim_set_hl(0, "SignColumn", { bg = "none" })
end

ColorMyPencils()
