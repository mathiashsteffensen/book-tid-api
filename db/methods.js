const mongoose = require('mongoose')

const {
    AdminCalendarSchema,
    AdminClient
} = require('./models/models')

AdminCalendarSchema.statics.createDefault = async function ( adminEmail, adminName )
{
    let defaultSchedule = {
        scheduleType: 'weekly',
        weeklySchedule: [
            {
                day: 0,
                schedule: 
                {
                    open: false
                }
            },
            {
                day: 1,
                schedule: 
                {
                    open: true,
                    startOfWork: 
                    {
                        hour: 8,
                        minute: 0
                    },
                    endOfWork: 
                    {
                        hour: 16,
                        minute: 0
                    }
                }
            },
            {
                day: 2,
                schedule: 
                {
                    open: true,
                    startOfWork: 
                    {
                        hour: 8,
                        minute: 0
                    },
                    endOfWork: 
                    {
                        hour: 16,
                        minute: 0
                    }
                }
            },
            {
                day: 3,
                schedule: 
                {
                    open: true,
                    startOfWork: 
                    {
                        hour: 8,
                        minute: 0
                    },
                    endOfWork: 
                    {
                        hour: 16,
                        minute: 0
                    }
                }
            }, 
            {
                day: 4,
                schedule: 
                {
                    open: true,
                    startOfWork: 
                    {
                        hour: 8,
                        minute: 0
                    },
                    endOfWork: 
                    {
                        hour: 16,
                        minute: 0
                    }
                }
            }, 
            {
                day: 5,
                schedule: 
                {
                    open: true,
                    startOfWork: 
                    {
                        hour: 8,
                        minute: 0
                    },
                    endOfWork: 
                    {
                        hour: 16,
                        minute: 0
                    }
                }
            }, 
            {
                day: 6,
                schedule: 
                {
                    open: false
                }
            }
        ],
        biWeeklySchedule: {
            evenWeek: [
                {
                    day: 0,
                    schedule: 
                    {
                        open: false
                    }
                },
                {
                    day: 1,
                    schedule: 
                    {
                        open: true,
                        startOfWork: 
                        {
                            hour: 8,
                            minute: 0
                        },
                        endOfWork: 
                        {
                            hour: 16,
                            minute: 0
                        }
                    }
                },
                {
                    day: 2,
                    schedule: 
                    {
                        open: true,
                        startOfWork: 
                        {
                            hour: 8,
                            minute: 0
                        },
                        endOfWork: 
                        {
                            hour: 16,
                            minute: 0
                        }
                    }
                },
                {
                    day: 3,
                    schedule: 
                    {
                        open: true,
                        startOfWork: 
                        {
                            hour: 8,
                            minute: 0
                        },
                        endOfWork: 
                        {
                            hour: 16,
                            minute: 0
                        }
                    }
                }, 
                {
                    day: 4,
                    schedule: 
                    {
                        open: true,
                        startOfWork: 
                        {
                            hour: 8,
                            minute: 0
                        },
                        endOfWork: 
                        {
                            hour: 16,
                            minute: 0
                        }
                    }
                }, 
                {
                    day: 5,
                    schedule: 
                    {
                        open: true,
                        startOfWork: 
                        {
                            hour: 8,
                            minute: 0
                        },
                        endOfWork: 
                        {
                            hour: 16,
                            minute: 0
                        }
                    }
                }, 
                {
                    day: 6,
                    schedule: 
                    {
                        open: false
                    }
                }
            ],
            unevenWeek: [
                {
                    day: 0,
                    schedule: 
                    {
                        open: false
                    }
                },
                {
                    day: 1,
                    schedule: 
                    {
                        open: true,
                        startOfWork: 
                        {
                            hour: 8,
                            minute: 0
                        },
                        endOfWork: 
                        {
                            hour: 16,
                            minute: 0
                        }
                    }
                },
                {
                    day: 2,
                    schedule: 
                    {
                        open: true,
                        startOfWork: 
                        {
                            hour: 8,
                            minute: 0
                        },
                        endOfWork: 
                        {
                            hour: 16,
                            minute: 0
                        }
                    }
                },
                {
                    day: 3,
                    schedule: 
                    {
                        open: true,
                        startOfWork: 
                        {
                            hour: 8,
                            minute: 0
                        },
                        endOfWork: 
                        {
                            hour: 16,
                            minute: 0
                        }
                    }
                }, 
                {
                    day: 4,
                    schedule: 
                    {
                        open: true,
                        startOfWork: 
                        {
                            hour: 8,
                            minute: 0
                        },
                        endOfWork: 
                        {
                            hour: 16,
                            minute: 0
                        }
                    }
                }, 
                {
                    day: 5,
                    schedule: 
                    {
                        open: true,
                        startOfWork: 
                        {
                            hour: 8,
                            minute: 0
                        },
                        endOfWork: 
                        {
                            hour: 16,
                            minute: 0
                        }
                    }
                }, 
                {
                    day: 6,
                    schedule: 
                    {
                        open: false
                    }
                }
            ]
        }
    }
    
    let colorList = 
    [
        {
            standardColor: '#f0001f',
            onlineColor: '#49adcc'
        },
        {
            standardColor: '#CEE27D',
            onlineColor: '#E00543'
        },
        {
            standardColor: '#D58936',
            onlineColor: '#FFF94F'
        },
        {
            standardColor: '#F1AB86',
            onlineColor: '#7ED3B2'
        },
        {
            standardColor: '#004A2F',
            onlineColor: '#FF6337'
        },
    ]
    console.log(adminEmail);
    const calendarID = `${Date.now()}`

    let currentAmount = await this.find({adminEmail: adminEmail}).countDocuments().exec()

    let maxAmount = await AdminClient.findOne({email: adminEmail}).select('maxNumberOfCalendars').exec()

    if (currentAmount === maxAmount.maxNumberOfCalendars)
    {
        throw new Error('Opgrader for at lave flere medarbejderkalendre')
    }

    
    let colorPalette;
    
    if (colorList.length > currentAmount)
    {
        colorPalette = colorList[currentAmount]
    } else
    {
        colorPalette = colorList[currentAmount- (Math.floor(currentAmount/colorList.length) * colorList.length)]
    }
    await this.create({
        adminEmail: adminEmail,
        calendarID: calendarID,
        name: adminName,
        email: adminEmail,
        schedule: defaultSchedule,
        services: ['Test Service'],
        holidaysOff: false,
        standardColor: colorPalette.onlineColor,
        onlineColor: colorPalette.standardColor
    }, function(err)
    {
        if (err) throw new Error(err.message)
    })

    return {calendarID}
}

module.exports = {
    AdminCalendarSchema
}