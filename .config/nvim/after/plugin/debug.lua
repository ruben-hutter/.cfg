local dap, dapui = require("dap"), require("dapui")

-- Language specific configurations
require("dap-python").setup("~/.venv/debugpy/bin/python")

dap.configurations.python = {
    {
        type = 'python';
        request = 'launch';
        name = "Launch file";
        program = "${file}";
        pythonPath = function()
            return '/home/ruben/.venv/debugpy/bin/python'
        end;
        --args = {"--trace", "tests/t2_begins.py"};
    },
}

dapui.setup()

dap.listeners.before.attach.dapui_config = function()
    dapui.open()
end

dap.listeners.before.launch.dapui_config = function()
    dapui.open()
end

dap.listeners.before.event_terminated.dapui_config = function()
    dapui.close()
end

dap.listeners.before.event_exited.dapui_config = function()
    dapui.close()
end

-- Keybindings
vim.keymap.set('n', '<leader>dt', function()
    dapui.toggle()
end)
vim.keymap.set('n', '<leader>dc', function() dap.continue() end)
vim.keymap.set('n', '<leader>dso', function() dap.step_over() end)
vim.keymap.set('n', '<leader>dsi', function() dap.step_into() end)
vim.keymap.set('n', '<leader>dsu', function() dap.step_out() end)
vim.keymap.set('n', '<leader>b', function()
    print("Toggle breakpoint")
    dap.toggle_breakpoint()
end)
vim.keymap.set('n', '<leader>B', function() dap.set_breakpoint() end)
vim.keymap.set('n', '<leader>lp', function() dap.set_breakpoint(nil, nil, vim.fn.input('Log point message: ')) end)
vim.keymap.set('n', '<leader>dr', function() dap.repl.open() end)
vim.keymap.set('n', '<leader>dl', function() dap.run_last() end)
vim.keymap.set({'n', 'v'}, '<leader>dh', function()
    require('dap.ui.widgets').hover()
end)
vim.keymap.set({'n', 'v'}, '<leader>dp', function()
    require('dap.ui.widgets').preview()
end)
vim.keymap.set('n', '<leader>df', function()
    local widgets = require('dap.ui.widgets')
    widgets.centered_float(widgets.frames)
end)
vim.keymap.set('n', '<leader>ds', function()
    local widgets = require('dap.ui.widgets')
    widgets.centered_float(widgets.scopes)
end)

