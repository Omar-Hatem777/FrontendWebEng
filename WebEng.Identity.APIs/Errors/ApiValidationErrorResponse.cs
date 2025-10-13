using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebEng.Identity.APIs.Errors
{
    public class ApiValidationErrorResponse : ApiResponse
    {
        public required IEnumerable<string> Errors { get; set; }

        public ApiValidationErrorResponse(string? message = null)
            : base(400, message)
        {

        }

      
    }

   

}
