/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url'],
    /**
     * @param{currentRecord} currentRecord
     * @param{url} url
     */
    function(currentRecord, url) {
        
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            window.onbeforeunload =null;
        }
    
        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
      
        // function fieldChanged(scriptContext) {
        //   //  window.setTimeout(setValues(),30000)
    
        // }
        function setValues(){
         try {
            
            let currRecord = currentRecord.get();
            let employeeId = currRecord.getValue({
                fieldId: "custpage_jj_employee"
            });
            console.log("employee",employeeId);
            document.location = url.resolveScript({
                deploymentId: "customdeploy_jj_sl_email_sup_otp7939",
                scriptId: "customscript_jj_sl_email_sup_otp7939",
                params: {
                    empId : employeeId
                }
            })

          
        
         } catch (e) {
            console.log("error",e.message+e.stack)
         }
    }
        return {
            pageInit: pageInit,
            //fieldChanged: fieldChanged,
            setValues:setValues
          
        };
        
    });
    