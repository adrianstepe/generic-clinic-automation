# Workflow Verification Guide

## 1. Verify n8n Workflow Execution
To confirm if your n8n workflows are pushing data to Supabase:

1.  **Open n8n Dashboard**: Go to your n8n instance.
2.  **Open Workflow**: Select the `n8n-2-stripe-confirmation` workflow.
3.  **Check Executions**: Click on the "Executions" tab (sidebar).
    *   Look for **Green** (Success) executions.
    *   If you see **Red** (Error) executions, click on them to see which node failed.
4.  **Inspect "Insert rows in a table" Node**:
    *   Click on the Postgres node in a successful execution.
    *   Check the "Output Data" to see exactly what was sent to Supabase.
    *   Verify that fields like `customer_name`, `start_time`, etc., are populated.
    *   **Note**: The `doctor_id` field is currently NOT mapped in this workflow, so it will be `NULL` in the database. This is why the dashboard was showing empty results (it was filtering for a specific doctor ID).

## 2. Verify Supabase Data
1.  **Open Supabase Dashboard**: Go to your project's Table Editor.
2.  **Check `bookings` Table**:
    *   Look for new rows created by n8n.
    *   Check if `doctor_id` is `NULL`.
3.  **Check `workflow_logs` Table**:
    *   If you have logging enabled in your workflows, check this table for debug info.

## 3. Frontend Connection Test
The dashboard has been updated to:
*   **Allow "All Doctors" View**: This will show bookings even if `doctor_id` is `NULL`.
*   **Show Errors**: If the connection fails, an error message will now appear in the "Appointment Requests" widget.

## Troubleshooting
*   **If n8n is Green but Supabase is Empty**: Check if you are connecting to the correct Supabase project/database (Production vs Staging). Check the Postgres credentials in n8n.
*   **If Dashboard is still 0**: Ensure you have selected "All Doctors" in the dashboard dropdown.
